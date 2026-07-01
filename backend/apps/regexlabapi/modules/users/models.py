"""Modelli legati all'utente: profilo e codici temporanei.

Il profilo contiene l'avatar. Il codice OTP viene usato dal modulo auth
per il recupero password senza salvare il codice in chiaro.
"""

import hashlib
import hmac
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
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
    def digest_code(raw_code: str) -> str:
        """Creo una firma del codice usando la secret key del progetto."""
        return hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            raw_code.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def store_code(self, raw_code: str) -> None:
        self.code = self.digest_code(raw_code)

    def accepts_code(self, raw_code: str) -> bool:
        expected_code = self.digest_code(raw_code)
        old_sha_code = hashlib.sha256(raw_code.encode("utf-8")).hexdigest()
        # Tengo compatibile per poco anche il vecchio SHA-256 semplice.
        return hmac.compare_digest(self.code, expected_code) or hmac.compare_digest(
            self.code,
            old_sha_code,
        )

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        if self.code and len(self.code) == 6 and self.code.isdigit():
            self.store_code(self.code)
        super().save(*args, **kwargs)

    def can_be_used(self) -> bool:
        return not self.is_used and timezone.now() <= self.expires_at
