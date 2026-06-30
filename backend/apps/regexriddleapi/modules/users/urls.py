from django.urls import path

from .views import (
    AccountAvatarEndpoint,
    AccountPasswordEndpoint,
    AccountRegistrationEndpoint,
    CurrentAccountEndpoint,
)

urlpatterns = [
    path("users", AccountRegistrationEndpoint.as_view(), name="users-create"),
    path("users/me", CurrentAccountEndpoint.as_view(), name="users-me"),
    path("users/me/avatar", AccountAvatarEndpoint.as_view(), name="users-me-avatar"),
    path("users/me/password", AccountPasswordEndpoint.as_view(), name="users-me-password"),
]
