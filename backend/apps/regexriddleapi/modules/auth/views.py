from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.middleware.csrf import get_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from ..users.serializers import UserReadSerializer
from .password_reset import password_reset_service
from .serializers import (
    LoginSerializer,
    PasswordOTPRequestSerializer,
    PasswordOTPVerifySerializer,
    PasswordResetSerializer,
)

User = get_user_model()


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip()
        password = serializer.validated_data["password"]
        user = User.objects.filter(email__iexact=email).first()
        username = user.username if user else ""
        auth_user = authenticate(request, username=username, password=password)

        if auth_user is None or not auth_user.is_active:
            return Response(
                {"detail": "Credenziali non valide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(auth_user)
        response = Response(
            {
                "accessToken": str(refresh.access_token),
                "user": UserReadSerializer(auth_user, context={"request": request}).data,
            }
        )
        set_refresh_cookie(response, str(refresh))
        get_token(request)
        return response


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token missing"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({"accessToken": serializer.validated_data["access"]})
        rotated_refresh = serializer.validated_data.get("refresh")
        if rotated_refresh:
            set_refresh_cookie(response, rotated_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class PasswordOTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password_reset_service.issue_otp_for_email(serializer.validated_data["email"])
        return Response({"detail": "Se l'email esiste, riceverai un codice di recupero."})


class PasswordOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        valid, expires_at = password_reset_service.verify_otp(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        if not valid:
            return Response({"valid": False})
        return Response({"valid": True, "expiresAt": expires_at})


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        changed = password_reset_service.reset_password_with_otp(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["newPassword"],
        )
        if not changed:
            return Response(
                {"detail": "Codice non valido o scaduto."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Password aggiornata."})
