"""Funzioni di supporto per controlli account e avatar.

Le tengo fuori dai serializer/view per non mischiare query riutilizzabili
con la costruzione delle risposte HTTP.
"""

from django.contrib.auth.models import User
from django.db.models.functions import Lower


def email_is_already_used(email: str, *, skip_user: User | None = None) -> bool:
    """Controllo l'unicita dell'email ignorando maiuscole e minuscole."""
    users = User.objects.annotate(email_lower=Lower("email")).filter(
        email_lower=email.strip().lower()
    )
    if skip_user is not None:
        users = users.exclude(pk=skip_user.pk)
    return users.exists()


def remove_avatar_file(user: User) -> None:
    """Cancello sia il file fisico sia il riferimento salvato nel profilo."""
    profile = user.profile
    if not profile.avatar:
        return

    profile.avatar.delete(save=False)
    profile.avatar = None
    profile.save(update_fields=["avatar", "updated_at"])
