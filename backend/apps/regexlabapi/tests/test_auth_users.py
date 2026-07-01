from io import BytesIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.regexlabapi.modules.users.models import UserProfile

User = get_user_model()


def make_png(name: str = "avatar.png", size: tuple[int, int] = (4, 4)) -> SimpleUploadedFile:
    image = Image.new("RGB", size, color="green")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT="/tmp/regexlab-test-media")
class AuthUsersApiTests(APITestCase):
    def register_payload(self, **overrides):
        payload = {
            "username": "mattia",
            "email": "mattia@example.com",
            "password": "StrongPass123!",
            "firstName": "Mattia",
            "lastName": "Lemma",
        }
        payload.update(overrides)
        return payload

    def create_user(self, **overrides):
        payload = self.register_payload(**overrides)
        password = payload.pop("password")
        user = User.objects.create_user(
            username=payload["username"],
            email=payload["email"],
            password=password,
            first_name=payload.get("firstName", ""),
            last_name=payload.get("lastName", ""),
        )
        UserProfile.objects.get_or_create(user=user)
        return user, password

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
        return user, response

    def test_register_user_creates_profile(self):
        response = self.client.post("/api/users", self.register_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "mattia@example.com")
        user = User.objects.get(email="mattia@example.com")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_register_requires_first_and_last_name(self):
        response = self.client.post(
            "/api/users",
            self.register_payload(firstName="", lastName=""),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("firstName", response.data)
        self.assertIn("lastName", response.data)

    def test_register_rejects_duplicate_email_case_insensitive(self):
        self.create_user(email="mattia@example.com")

        response = self.client.post(
            "/api/users",
            self.register_payload(username="other", email="MATTIA@example.com"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_database_rejects_duplicate_email_case_insensitive(self):
        User.objects.create_user(
            username="first",
            email="mattia@example.com",
            password="StrongPass123!",
        )

        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(
                username="second",
                email="MATTIA@example.com",
                password="StrongPass123!",
            )

    def test_login_returns_access_token_and_refresh_cookie(self):
        user, password = self.create_user()

        response = self.client.post(
            "/api/sessions",
            {"email": user.email, "password": password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", response.data)
        self.assertEqual(response.data["user"]["userId"], user.id)
        self.assertIn(settings.AUTH_REFRESH_COOKIE_NAME, response.cookies)
        self.assertTrue(response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]["httponly"])

    def test_login_requires_csrf_when_checks_are_enforced(self):
        user, password = self.create_user()
        csrf_client = APIClient(enforce_csrf_checks=True)

        missing_response = csrf_client.post(
            "/api/sessions",
            {"email": user.email, "password": password},
            format="json",
        )
        token_response = csrf_client.get("/api/security/csrf-token")
        protected_response = csrf_client.post(
            "/api/sessions",
            {"email": user.email, "password": password},
            HTTP_X_CSRFTOKEN=token_response.data["csrfToken"],
            format="json",
        )

        self.assertEqual(missing_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(protected_response.status_code, status.HTTP_200_OK)

    def test_login_rejects_bad_credentials(self):
        user, _ = self.create_user()

        response = self.client.post(
            "/api/sessions",
            {"email": user.email, "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Credenziali non valide.")

    def test_login_is_rate_limited(self):
        original_rates = ScopedRateThrottle.THROTTLE_RATES
        ScopedRateThrottle.THROTTLE_RATES = {"login": "2/min"}
        cache.clear()
        try:
            payload = {"email": "missing@example.com", "password": "WrongPass123!"}

            first_response = self.client.post("/api/sessions", payload, format="json")
            second_response = self.client.post("/api/sessions", payload, format="json")
            throttled_response = self.client.post("/api/sessions", payload, format="json")
        finally:
            ScopedRateThrottle.THROTTLE_RATES = original_rates
            cache.clear()

        self.assertEqual(first_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(second_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(throttled_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_refresh_access_token_uses_cookie(self):
        _, login_response = self.authenticate()
        refresh_cookie = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value
        self.client.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = refresh_cookie

        response = self.client.post("/api/sessions/current/access-token", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", response.data)

    def test_refresh_requires_csrf_when_checks_are_enforced(self):
        user, password = self.create_user()
        csrf_client = APIClient(enforce_csrf_checks=True)
        token_response = csrf_client.get("/api/security/csrf-token")
        login_response = csrf_client.post(
            "/api/sessions",
            {"email": user.email, "password": password},
            HTTP_X_CSRFTOKEN=token_response.data["csrfToken"],
            format="json",
        )
        refresh_cookie = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value
        csrf_client.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = refresh_cookie

        missing_response = csrf_client.post("/api/sessions/current/access-token", {}, format="json")
        protected_response = csrf_client.post(
            "/api/sessions/current/access-token",
            {},
            HTTP_X_CSRFTOKEN=token_response.data["csrfToken"],
            format="json",
        )

        self.assertEqual(missing_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(protected_response.status_code, status.HTTP_200_OK)

    def test_logout_clears_refresh_cookie(self):
        _, login_response = self.authenticate()
        refresh_cookie = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value
        self.client.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = refresh_cookie

        response = self.client.delete("/api/sessions/current")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIn(settings.AUTH_REFRESH_COOKIE_NAME, response.cookies)
        self.assertEqual(response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value, "")

    def test_current_user_requires_authentication(self):
        response = self.client.get("/api/users/me")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_current_user_profile(self):
        user, _ = self.authenticate()

        response = self.client.patch(
            "/api/users/me",
            {
                "username": "lemma",
                "email": "lemma@example.com",
                "firstName": "Lemma",
                "lastName": "Regex",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.username, "lemma")
        self.assertEqual(user.email, "lemma@example.com")
        self.assertEqual(response.data["firstName"], "Lemma")

    def test_update_current_user_rejects_blank_names(self):
        self.authenticate()

        response = self.client.patch(
            "/api/users/me",
            {"firstName": "", "lastName": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("firstName", response.data)
        self.assertIn("lastName", response.data)

    def test_upload_avatar_accepts_image(self):
        self.authenticate()

        response = self.client.put(
            "/api/users/me/avatar",
            {"avatar": make_png()},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["avatarUrl"])
        self.assertTrue(response.data["avatarUrl"].startswith("/media/avatars/"))
        self.assertNotIn("backend:8000", response.data["avatarUrl"])

    def test_current_user_hides_missing_avatar_file(self):
        user, _ = self.authenticate()
        user.profile.avatar.name = "avatars/missing-avatar.png"
        user.profile.save(update_fields=["avatar", "updated_at"])

        response = self.client.get("/api/users/me")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["avatarUrl"])

    def test_upload_avatar_rejects_non_image(self):
        self.authenticate()
        upload = SimpleUploadedFile("notes.txt", b"not an image", content_type="text/plain")

        response = self.client.put(
            "/api/users/me/avatar",
            {"avatar": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)

    def test_upload_avatar_rejects_large_dimensions(self):
        self.authenticate()

        response = self.client.put(
            "/api/users/me/avatar",
            {"avatar": make_png(size=(1025, 4))},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
