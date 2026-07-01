"""Rotte pubbliche per login, sessione e recupero password."""

from django.urls import path

from .views import (
    AccessTokenView,
    CsrfTokenView,
    LoginView,
    LogoutView,
    RecoveryCodeView,
    RecoveryCompleteView,
    RecoveryStartView,
)


# Mantengo gli URL stabili: il refactor cambia solo i nomi interni delle view.
urlpatterns = [
    path("security/csrf-token", CsrfTokenView.as_view(), name="csrf-token"),
    path("password-reset-requests", RecoveryStartView.as_view(), name="password-reset-requests"),
    path(
        "password-reset-verifications",
        RecoveryCodeView.as_view(),
        name="password-reset-verifications",
    ),
    path("password-resets", RecoveryCompleteView.as_view(), name="password-resets"),
    path("sessions", LoginView.as_view(), name="sessions-create"),
    path("sessions/current/access-token", AccessTokenView.as_view(), name="sessions-refresh"),
    path("sessions/current", LogoutView.as_view(), name="sessions-current"),
]
