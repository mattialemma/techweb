from django.contrib import admin

from .modules.challenges.models import Attempt, Challenge, ControlString
from .modules.users.models import PasswordResetOTP, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "avatar", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "is_used", "attempt_count", "expires_at", "created_at")
    list_filter = ("is_used", "created_at", "expires_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("code", "created_at", "last_attempt_at")


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "is_published", "created_at")
    list_filter = ("is_published", "created_at")
    search_fields = ("title", "description", "author__username", "author__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ControlString)
class ControlStringAdmin(admin.ModelAdmin):
    list_display = ("challenge", "kind", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("challenge__title", "value")


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = (
        "challenge",
        "solver",
        "attempt_number",
        "positive_matched",
        "negative_matched",
        "solved",
        "created_at",
    )
    list_filter = ("solved", "created_at")
    search_fields = ("challenge__title", "solver__username", "solver__email")
