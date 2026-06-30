from django.urls import path

from .views import (
    PasswordResetApplyEndpoint,
    PasswordResetCodeRequestEndpoint,
    PasswordResetCodeVerifyEndpoint,
    SecurityTokenEndpoint,
    SessionCreateEndpoint,
    SessionDestroyEndpoint,
    SessionRefreshEndpoint,
)

urlpatterns = [
    path("security/csrf-token", SecurityTokenEndpoint.as_view(), name="csrf-token"),
    path(
        "password-reset-requests",
        PasswordResetCodeRequestEndpoint.as_view(),
        name="password-reset-requests",
    ),
    path(
        "password-reset-verifications",
        PasswordResetCodeVerifyEndpoint.as_view(),
        name="password-reset-verifications",
    ),
    path("password-resets", PasswordResetApplyEndpoint.as_view(), name="password-resets"),
    path("sessions", SessionCreateEndpoint.as_view(), name="sessions-create"),
    path("sessions/current/access-token", SessionRefreshEndpoint.as_view(), name="sessions-refresh"),
    path("sessions/current", SessionDestroyEndpoint.as_view(), name="sessions-current"),
]
