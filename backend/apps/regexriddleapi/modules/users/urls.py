from django.urls import path

from .views import CurrentUserAvatarView, CurrentUserPasswordView, CurrentUserView, UserCreateView

urlpatterns = [
    path("users", UserCreateView.as_view(), name="users-create"),
    path("users/me", CurrentUserView.as_view(), name="users-me"),
    path("users/me/avatar", CurrentUserAvatarView.as_view(), name="users-me-avatar"),
    path("users/me/password", CurrentUserPasswordView.as_view(), name="users-me-password"),
]
