from django.contrib.auth.models import User
from django.db.models.functions import Lower


def account_email_is_taken(email: str, *, excluding_user: User | None = None) -> bool:
    queryset = User.objects.annotate(email_lower=Lower("email")).filter(
        email_lower=email.strip().lower()
    )
    if excluding_user is not None:
        queryset = queryset.exclude(pk=excluding_user.pk)
    return queryset.exists()


def delete_avatar_storage_file(user: User) -> None:
    profile = user.profile
    if profile.avatar:
        profile.avatar.delete(save=False)
        profile.avatar = None
        profile.save(update_fields=["avatar", "updated_at"])
