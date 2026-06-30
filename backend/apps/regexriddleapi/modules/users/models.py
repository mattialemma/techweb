"""User-adjacent persistence models for profiles and password recovery OTPs.

Exports profile storage and short-lived reset codes used by auth workflows.
"""

import hashlib
import hmac
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Profile for {self.user}"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_otps",
    )
    code = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_used", "expires_at"]),
        ]
        ordering = ["-created_at"]

    @staticmethod
    def hash_code(raw_code: str) -> str:
        return hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            raw_code.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def set_code(self, raw_code: str) -> None:
        self.code = self.hash_code(raw_code)

    def matches_code(self, raw_code: str) -> bool:
        expected_code = self.hash_code(raw_code)
        legacy_code = hashlib.sha256(raw_code.encode("utf-8")).hexdigest()
        # Accept legacy SHA-256 codes only for their short expiry window after deploy.
        return hmac.compare_digest(self.code, expected_code) or hmac.compare_digest(
            self.code,
            legacy_code,
        )

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        if self.code and len(self.code) == 6 and self.code.isdigit():
            self.set_code(self.code)
        super().save(*args, **kwargs)

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() <= self.expires_at
