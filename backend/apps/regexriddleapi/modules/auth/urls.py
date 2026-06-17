from django.urls import path

from .views import (
    CSRFTokenView,
    LoginView,
    LogoutView,
    PasswordOTPRequestView,
    PasswordOTPVerifyView,
    PasswordResetView,
    RefreshView,
)

urlpatterns = [
    path("security/csrf-token", CSRFTokenView.as_view(), name="csrf-token"),
    path("password-reset-requests", PasswordOTPRequestView.as_view(), name="password-reset-requests"),
    path(
        "password-reset-verifications",
        PasswordOTPVerifyView.as_view(),
        name="password-reset-verifications",
    ),
    path("password-resets", PasswordResetView.as_view(), name="password-resets"),
    path("sessions", LoginView.as_view(), name="sessions-create"),
    path("sessions/current/access-token", RefreshView.as_view(), name="sessions-refresh"),
    path("sessions/current", LogoutView.as_view(), name="sessions-current"),
]
