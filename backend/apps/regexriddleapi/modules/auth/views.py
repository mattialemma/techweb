"""Authentication and password recovery API views.

Owns session creation, JWT refresh-cookie handling, logout, CSRF token exposure,
and OTP-based password reset entrypoints.
"""

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from ..users.serializers import AccountReadSerializer
from .password_reset import password_reset_service
from .serializers import (
    LoginSerializer,
    LoginResponseSerializer,
    DetailResponseSerializer,
    CSRFTokenResponseSerializer,
    PasswordOTPRequestSerializer,
    PasswordOTPVerifyResponseSerializer,
    PasswordOTPVerifySerializer,
    PasswordResetSerializer,
    RefreshResponseSerializer,
)

User = get_user_model()


class SecurityTokenEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(operation_id="csrf_token_retrieve", responses=CSRFTokenResponseSerializer)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


@method_decorator(csrf_protect, name="dispatch")
class SessionCreateEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(
        operation_id="sessions_create",
        request=LoginSerializer,
        responses=LoginResponseSerializer,
    )
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
                "user": AccountReadSerializer(auth_user, context={"request": request}).data,
            }
        )
        attach_refresh_cookie(response, str(refresh))
        get_token(request)
        return response


@method_decorator(csrf_protect, name="dispatch")
class SessionRefreshEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"

    @extend_schema(
        operation_id="sessions_access_token_create",
        request=None,
        responses=RefreshResponseSerializer,
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh_token:
            # No cookie means the browser has no active session yet; keep app boot quiet.
            return Response(status=status.HTTP_204_NO_CONTENT)

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
            attach_refresh_cookie(response, rotated_refresh)
        return response


@method_decorator(csrf_protect, name="dispatch")
class SessionDestroyEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "logout"

    @extend_schema(operation_id="sessions_current_destroy", responses=None)
    def delete(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        expire_refresh_cookie(response)
        return response


class PasswordResetCodeRequestEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_request"

    @extend_schema(
        operation_id="password_reset_requests_create",
        request=PasswordOTPRequestSerializer,
        responses=DetailResponseSerializer,
    )
    def post(self, request):
        serializer = PasswordOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password_reset_service.issue_otp_for_email(serializer.validated_data["email"])
        return Response({"detail": "Se l'email esiste, riceverai un codice di recupero."})


class PasswordResetCodeVerifyEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_verify"

    @extend_schema(
        operation_id="password_reset_verifications_create",
        request=PasswordOTPVerifySerializer,
        responses=PasswordOTPVerifyResponseSerializer,
    )
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


class PasswordResetApplyEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_apply"

    @extend_schema(
        operation_id="password_resets_create",
        request=PasswordResetSerializer,
        responses=DetailResponseSerializer,
    )
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


def attach_refresh_cookie(response: Response, refresh_token: str) -> None:
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


def expire_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )
