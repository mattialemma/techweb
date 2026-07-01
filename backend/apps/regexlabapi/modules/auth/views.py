"""View API per autenticazione, sessione e recupero password.

Questo file tiene solo la logica HTTP: validazione input, risposta al client
e gestione cookie. La logica OTP vera e propria vive in ``password_reset.py``.
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
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from ..users.serializers import PublicUserSerializer
from .password_reset import password_recovery
from .serializers import (
    AccessTokenSerializer,
    CredentialsSerializer,
    CsrfHandshakeSerializer,
    EmailRecoveryRequestSerializer,
    MessageSerializer,
    PasswordRecoveryApplySerializer,
    RecoveryCodeCheckSerializer,
    RecoveryCodeStatusSerializer,
    SessionCreatedSerializer,
)

User = get_user_model()


# --- Cookie di sessione -----------------------------------------------------


def remember_refresh_token(response: Response, token: str) -> None:
    """Salva il refresh token in un cookie httpOnly, quindi non leggibile da JS."""
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
    )


def forget_refresh_token(response: Response) -> None:
    """Rimuove il cookie di refresh quando l'utente fa logout."""
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


# --- Login, refresh e logout ------------------------------------------------


class CsrfTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(operation_id="csrf_token_retrieve", responses=CsrfHandshakeSerializer)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(
        operation_id="sessions_create",
        request=CredentialsSerializer,
        responses=SessionCreatedSerializer,
    )
    def post(self, request):
        serializer = CredentialsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_user = self._authenticate_by_email(
            request=request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if auth_user is None or not auth_user.is_active:
            return Response(
                {"detail": "Credenziali non valide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(auth_user)
        response = Response(
            {
                "accessToken": str(refresh.access_token),
                "user": PublicUserSerializer(auth_user, context={"request": request}).data,
            }
        )
        remember_refresh_token(response, str(refresh))
        get_token(request)
        return response

    def _authenticate_by_email(self, *, request, email: str, password: str):
        user = User.objects.filter(email__iexact=email.strip()).first()
        username = user.username if user else ""
        return authenticate(request, username=username, password=password)


@method_decorator(csrf_protect, name="dispatch")
class AccessTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"

    @extend_schema(
        operation_id="sessions_access_token_create",
        request=None,
        responses=AccessTokenSerializer,
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh_token:
            # Se il browser non ha ancora una sessione, evito un errore rumoroso all'avvio.
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
        rotated_token = serializer.validated_data.get("refresh")
        if rotated_token:
            remember_refresh_token(response, rotated_token)
        return response


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
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
        forget_refresh_token(response)
        return response


# --- Recupero password ------------------------------------------------------


class RecoveryStartView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_request"

    @extend_schema(
        operation_id="password_reset_requests_create",
        request=EmailRecoveryRequestSerializer,
        responses=MessageSerializer,
    )
    def post(self, request):
        serializer = EmailRecoveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password_recovery.send_code(serializer.validated_data["email"])
        return Response({"detail": "Se l'email esiste, riceverai un codice di recupero."})


class RecoveryCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_verify"

    @extend_schema(
        operation_id="password_reset_verifications_create",
        request=RecoveryCodeCheckSerializer,
        responses=RecoveryCodeStatusSerializer,
    )
    def post(self, request):
        serializer = RecoveryCodeCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        valid, expires_at = password_recovery.is_code_valid(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        if not valid:
            return Response({"valid": False})
        return Response({"valid": True, "expiresAt": expires_at})


class RecoveryCompleteView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_apply"

    @extend_schema(
        operation_id="password_resets_create",
        request=PasswordRecoveryApplySerializer,
        responses=MessageSerializer,
    )
    def post(self, request):
        serializer = PasswordRecoveryApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        changed = password_recovery.change_password(
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
