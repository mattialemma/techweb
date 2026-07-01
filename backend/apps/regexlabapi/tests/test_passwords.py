"""Password recovery and account password-change API tests."""

import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.regexlabapi.modules.users.models import PasswordResetOTP

User = get_user_model()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordApiTests(APITestCase):
    def create_user(self, **overrides):
        payload = {
            "username": "solver",
            "email": "solver@example.com",
            "password": "StrongPass123!",
        }
        payload.update(overrides)
        return User.objects.create_user(**payload), payload["password"]

    def authenticate(self, user=None, password="StrongPass123!"):
        if user is None:
            user, password = self.create_user(password=password)
        response = self.client.post(
            "/api/sessions",
            {"email": user.email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['accessToken']}")
        return user

    def latest_email_code(self) -> str:
        message = mail.outbox[-1].body
        match = re.search(r"\b(\d{6})\b", message)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_request_password_otp_creates_hashed_code_and_sends_email(self):
        user, _ = self.create_user()

        response = self.client.post(
            "/api/password-reset-requests",
            {"email": user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetOTP.objects.filter(user=user, is_used=False).count(), 1)
        otp = PasswordResetOTP.objects.get(user=user, is_used=False)
        code = self.latest_email_code()
        self.assertNotEqual(otp.code, code)
        self.assertEqual(otp.code, PasswordResetOTP.digest_code(code))
        self.assertTrue(otp.accepts_code(code))

    def test_request_password_otp_does_not_reveal_unknown_email(self):
        response = self.client.post(
            "/api/password-reset-requests",
            {"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetOTP.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_verify_password_otp_accepts_latest_valid_code(self):
        user, _ = self.create_user()
        self.client.post("/api/password-reset-requests", {"email": user.email}, format="json")
        code = self.latest_email_code()

        response = self.client.post(
            "/api/password-reset-verifications",
            {"email": user.email, "code": code},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["valid"])

    def test_reset_password_consumes_otp_and_updates_login_password(self):
        user, _ = self.create_user()
        self.client.post("/api/password-reset-requests", {"email": user.email}, format="json")
        code = self.latest_email_code()

        response = self.client.post(
            "/api/password-resets",
            {"email": user.email, "code": code, "newPassword": "NewStrong123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            PasswordResetOTP.objects.filter(user=user, is_used=False).exists()
        )
        self.assertEqual(
            self.client.post(
                "/api/sessions",
                {"email": user.email, "password": "NewStrong123!"},
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )

    def test_reset_password_keeps_otp_active_when_new_password_is_invalid(self):
        user, _ = self.create_user()
        self.client.post("/api/password-reset-requests", {"email": user.email}, format="json")
        code = self.latest_email_code()

        response = self.client.post(
            "/api/password-resets",
            {"email": user.email, "code": code, "newPassword": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(PasswordResetOTP.objects.filter(user=user, is_used=False).exists())

        retry_response = self.client.post(
            "/api/password-resets",
            {"email": user.email, "code": code, "newPassword": "NewStrong123!"},
            format="json",
        )

        self.assertEqual(retry_response.status_code, status.HTTP_200_OK)

    def test_change_current_password_requires_correct_current_password(self):
        self.authenticate()

        response = self.client.put(
            "/api/users/me/password",
            {"currentPassword": "wrong-pass", "newPassword": "NewStrong123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("currentPassword", response.data)

    def test_change_current_password_updates_password(self):
        user = self.authenticate()

        response = self.client.put(
            "/api/users/me/password",
            {"currentPassword": "StrongPass123!", "newPassword": "NewStrong123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewStrong123!"))
