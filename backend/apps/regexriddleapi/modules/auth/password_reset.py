"""Password reset OTP workflow, adapted from BugBoard26 for REGEXRIDDLE."""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from ...common.email_sender import email_sender
from ..users.models import PasswordResetOTP
from ..users.serializers import validate_password_complexity

logger = logging.getLogger(__name__)
User = get_user_model()

OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
PRODUCT_NAME = "REGEXRIDDLE"


class PasswordResetService:
    """Issues, verifies, and consumes single-use password reset OTP codes."""

    def __init__(self, *, sender=email_sender) -> None:
        self._sender = sender

    def issue_otp_for_email(self, email: str) -> None:
        user = self._find_active_user_by_email(email)
        if not user:
            logger.info("password_reset_unknown email_hash=%s", self._email_hash(email))
            return

        now = timezone.now()
        raw_code = f"{secrets.randbelow(1_000_000):06d}"
        pending_otp = PasswordResetOTP.objects.create(
            user=user,
            code=raw_code,
            expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
            is_used=True,
            attempt_count=0,
            last_attempt_at=None,
        )

        try:
            self.send_otp_email(email=user.email, code=raw_code)
            self._mark_pending_otp_delivered(user=user, pending_otp=pending_otp)
            logger.info("password_reset_sent user_id=%s", user.id)
        except Exception:
            logger.exception("password_reset_send_failed user_id=%s", user.id)

    def verify_otp(self, *, email: str, code: str) -> tuple[bool, datetime | None]:
        user = self._find_active_user_by_email(email)
        if not user:
            logger.info("password_reset_verify_unknown email_hash=%s", self._email_hash(email))
            return False, None

        with transaction.atomic():
            valid, otp = self._validate_otp_attempt(user=user, code=code, lock=True)

        return (True, otp.expires_at) if valid and otp else (False, None)

    def reset_password_with_otp(self, *, email: str, code: str, new_password: str) -> bool:
        user = self._find_active_user_by_email(email)
        if not user:
            logger.info("password_reset_apply_unknown email_hash=%s", self._email_hash(email))
            return False

        with transaction.atomic():
            valid, otp = self._validate_otp_attempt(
                user=user,
                code=code,
                lock=True,
                consume_on_match=True,
            )
            if not valid or otp is None:
                return False

            self._validate_new_password(user=user, new_password=new_password)
            user.set_password(new_password)
            user.save(update_fields=["password"])

        return True

    def send_otp_email(self, *, email: str, code: str) -> None:
        self._sender.send(
            email=email,
            plain_subject="REGEXRIDDLE codice recupero password",
            plain_message=(
                f"Il tuo codice REGEXRIDDLE e {code}. "
                f"Scade tra {OTP_EXPIRY_MINUTES} minuti."
            ),
            brevo_template_id=getattr(settings, "BREVO_OTP_TEMPLATE_ID", ""),
            brevo_merge_data={
                "otp_code": code,
                "expiry_minutes": OTP_EXPIRY_MINUTES,
                "product_name": PRODUCT_NAME,
            },
        )

    def _find_active_user_by_email(self, email: str):
        return User.objects.filter(email__iexact=email.strip(), is_active=True).first()

    def _validate_otp_attempt(
        self,
        *,
        user,
        code: str,
        lock: bool = False,
        consume_on_match: bool = False,
    ) -> tuple[bool, PasswordResetOTP | None]:
        otp_queryset = PasswordResetOTP.objects.filter(user=user, is_used=False)
        if lock:
            otp_queryset = otp_queryset.select_for_update()
        otp = otp_queryset.order_by("-created_at").first()
        if not otp or not otp.is_valid():
            return False, None

        if otp.matches_code(code):
            if consume_on_match and not self._consume_otp(otp=otp):
                return False, None
            return True, otp

        otp.attempt_count += 1
        otp.last_attempt_at = timezone.now()
        if otp.attempt_count >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
        otp.save(update_fields=["attempt_count", "last_attempt_at", "is_used"])
        return False, otp

    def _consume_otp(self, *, otp: PasswordResetOTP) -> bool:
        consumed_rows = PasswordResetOTP.objects.filter(pk=otp.pk, is_used=False).update(is_used=True)
        if consumed_rows != 1:
            return False
        otp.is_used = True
        return True

    def _mark_pending_otp_delivered(self, *, user, pending_otp: PasswordResetOTP) -> None:
        with transaction.atomic():
            PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)
            pending_otp.is_used = False
            pending_otp.save(update_fields=["is_used"])

    def _validate_new_password(self, *, user, new_password: str) -> None:
        if user.check_password(new_password):
            raise serializers.ValidationError(
                {"newPassword": "La nuova password deve essere diversa da quella attuale."}
            )
        validate_password_complexity(new_password)
        validate_password(new_password, user=user)

    @staticmethod
    def _email_hash(email: str) -> str:
        return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:12]


password_reset_service = PasswordResetService()
