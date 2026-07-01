"""Rotte account: registrazione, profilo personale, avatar e password."""

from django.urls import path

from .views import MyAvatarView, MyPasswordView, MyProfileView, RegisterUserView


urlpatterns = [
    path("users", RegisterUserView.as_view(), name="users-create"),
    path("users/me", MyProfileView.as_view(), name="users-me"),
    path("users/me/avatar", MyAvatarView.as_view(), name="users-me-avatar"),
    path("users/me/password", MyPasswordView.as_view(), name="users-me-password"),
]
