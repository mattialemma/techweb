"""Gestione del recupero password tramite codice numerico.

Il file espone un solo oggetto, ``password_recovery``, usato dalle view.
Qui tengo insieme generazione OTP, controlli sul codice e cambio password.
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from ...common.email_sender import email_sender
from ..users.models import PasswordResetOTP
from ..users.serializers import check_password_strength

logger = logging.getLogger(__name__)
User = get_user_model()

CODE_DURATION_MINUTES = 5
MAX_WRONG_CODES = 5
APP_NAME = "REGEXLAB"


# --- Funzioni piccole e isolate --------------------------------------------


def make_reset_code() -> str:
    """Creo sempre un codice a 6 cifre, anche quando inizia con zero."""
    return f"{secrets.randbelow(1_000_000):06d}"


def anonymize_email(email: str) -> str:
    """Nei log salvo solo un'impronta dell'email, non l'indirizzo completo."""
    normalized_email = email.strip().lower()
    return hashlib.sha256(normalized_email.encode("utf-8")).hexdigest()[:12]


def find_enabled_user(email: str):
    """Recupero l'utente attivo usando l'email senza distinguere maiuscole/minuscole."""
    return User.objects.filter(email__iexact=email.strip(), is_active=True).first()


class PasswordRecoveryManager:
    """Contiene il flusso del recupero password mantenendo semplici le view."""

    def __init__(self, *, mailer=email_sender) -> None:
        self.mailer = mailer

    # --- Metodi chiamati dalle view ----------------------------------------

    def send_code(self, email: str) -> None:
        account = find_enabled_user(email)
        if account is None:
            logger.info("password_reset_unknown email_hash=%s", anonymize_email(email))
            return

        code = make_reset_code()
        saved_code = self._create_inactive_code(account=account, code=code)

        try:
            self._send_email(address=account.email, code=code)
            self._replace_previous_codes(account=account, new_code=saved_code)
            logger.info("password_reset_sent user_id=%s", account.id)
        except Exception:
            logger.exception("password_reset_send_failed user_id=%s", account.id)

    def is_code_valid(self, *, email: str, code: str) -> tuple[bool, datetime | None]:
        account = find_enabled_user(email)
        if account is None:
            logger.info("password_reset_verify_unknown email_hash=%s", anonymize_email(email))
            return False, None

        with transaction.atomic():
            current_code = self._latest_open_code(account, for_update=True)
            if not self._check_code(current_code, code):
                return False, None

        return True, current_code.expires_at

    def change_password(self, *, email: str, code: str, new_password: str) -> bool:
        account = find_enabled_user(email)
        if account is None:
            logger.info("password_reset_apply_unknown email_hash=%s", anonymize_email(email))
            return False

        with transaction.atomic():
            current_code = self._latest_open_code(account, for_update=True)
            if not self._check_code(current_code, code):
                return False

            self._check_new_password(account=account, new_password=new_password)
            if not self._close_code(current_code):
                return False

            account.set_password(new_password)
            account.save(update_fields=["password"])

        return True

    # --- Creazione e invio del codice --------------------------------------

    def _create_inactive_code(self, *, account, code: str) -> PasswordResetOTP:
        expires_at = timezone.now() + timedelta(minutes=CODE_DURATION_MINUTES)
        return PasswordResetOTP.objects.create(
            user=account,
            code=code,
            expires_at=expires_at,
            is_used=True,
            attempt_count=0,
            last_attempt_at=None,
        )

    def _replace_previous_codes(self, *, account, new_code: PasswordResetOTP) -> None:
        with transaction.atomic():
            PasswordResetOTP.objects.filter(user=account, is_used=False).update(is_used=True)
            new_code.is_used = False
            new_code.save(update_fields=["is_used"])

    def _send_email(self, *, address: str, code: str) -> None:
        self.mailer.send(
            email=address,
            plain_subject=f"{APP_NAME} codice recupero password",
            plain_message=(
                f"Il tuo codice {APP_NAME} e {code}. "
                f"Scade tra {CODE_DURATION_MINUTES} minuti."
            ),
        )

    # --- Lettura e consumo del codice --------------------------------------

    def _latest_open_code(self, account, *, for_update: bool = False) -> PasswordResetOTP | None:
        codes = PasswordResetOTP.objects.filter(user=account, is_used=False)
        if for_update:
            codes = codes.select_for_update()
        return codes.order_by("-created_at").first()

    def _check_code(self, saved_code: PasswordResetOTP | None, typed_code: str) -> bool:
        if saved_code is None or not saved_code.can_be_used():
            return False

        if saved_code.accepts_code(typed_code):
            return True

        self._count_wrong_code(saved_code)
        return False

    def _count_wrong_code(self, saved_code: PasswordResetOTP) -> None:
        saved_code.attempt_count += 1
        saved_code.last_attempt_at = timezone.now()
        if saved_code.attempt_count >= MAX_WRONG_CODES:
            saved_code.is_used = True
        saved_code.save(update_fields=["attempt_count", "last_attempt_at", "is_used"])

    def _close_code(self, saved_code: PasswordResetOTP) -> bool:
        closed_rows = PasswordResetOTP.objects.filter(pk=saved_code.pk, is_used=False).update(
            is_used=True
        )
        saved_code.is_used = closed_rows == 1
        return closed_rows == 1

    # --- Validazione password ----------------------------------------------

    def _check_new_password(self, *, account, new_password: str) -> None:
        if account.check_password(new_password):
            raise serializers.ValidationError(
                {"newPassword": "La nuova password deve essere diversa da quella attuale."}
            )
        check_password_strength(new_password)
        validate_password(new_password, user=account)


password_recovery = PasswordRecoveryManager()
