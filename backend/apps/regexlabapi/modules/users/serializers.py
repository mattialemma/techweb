"""Serializer e validazioni per gli account utente.

Qui mantengo il contratto JSON usato dal frontend: registrazione, profilo,
password e avatar. Le funzioni helper sono riusate anche da auth/challenges.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .services import email_is_already_used

User = get_user_model()

USERNAME_MAX_LENGTH = 20
PASSWORD_MAX_LENGTH = 20
EMAIL_MAX_LENGTH = 128
NAME_MAX_LENGTH = 25


# --- Helper condivisi -------------------------------------------------------


def avatar_url_for_user(user, request=None) -> str | None:
    """Restituisco l'URL avatar solo se il file esiste davvero nello storage."""
    avatar = getattr(getattr(user, "profile", None), "avatar", None)
    if not avatar:
        return None
    try:
        if not avatar.storage.exists(avatar.name):
            return None
        # URL relativo: cosi proxy e Docker non espongono host interni.
        return avatar.url
    except ValueError:
        return None


def check_password_strength(value: str) -> None:
    """Applico le regole password comuni a registrazione, cambio e reset."""
    checks = (
        (len(value) > PASSWORD_MAX_LENGTH, "La password puo avere al massimo 20 caratteri."),
        (len(value) < 8, "La password deve avere almeno 8 caratteri."),
        (not any(char.islower() for char in value), "La password deve contenere una lettera minuscola."),
        (not any(char.isupper() for char in value), "La password deve contenere una lettera maiuscola."),
        (not any(char.isdigit() for char in value), "La password deve contenere un numero."),
        (not any(not char.isalnum() for char in value), "La password deve contenere un carattere speciale."),
    )
    for failed, message in checks:
        if failed:
            raise serializers.ValidationError(message)


def clean_required_text(value: str, message: str) -> str:
    clean_value = value.strip()
    if not clean_value:
        raise serializers.ValidationError(message)
    return clean_value


# --- Risposte utente --------------------------------------------------------


class PublicUserSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source="id", read_only=True)
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("userId", "username", "email", "firstName", "lastName", "avatarUrl")

    def get_avatarUrl(self, user) -> str | None:
        return avatar_url_for_user(user, self.context.get("request"))


# --- Dati ricevuti dal frontend --------------------------------------------


class NewUserSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=USERNAME_MAX_LENGTH,
        error_messages={
            "blank": "Username obbligatorio.",
            "max_length": f"Massimo {USERNAME_MAX_LENGTH} caratteri.",
            "required": "Username obbligatorio.",
        },
    )
    email = serializers.EmailField(
        max_length=EMAIL_MAX_LENGTH,
        error_messages={
            "blank": "Email obbligatoria.",
            "invalid": "Inserisci un'email valida.",
            "max_length": f"Massimo {EMAIL_MAX_LENGTH} caratteri.",
            "required": "Email obbligatoria.",
        },
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=PASSWORD_MAX_LENGTH,
        error_messages={
            "blank": "Password obbligatoria.",
            "max_length": f"Massimo {PASSWORD_MAX_LENGTH} caratteri.",
            "min_length": "La password deve avere almeno 8 caratteri.",
            "required": "Password obbligatoria.",
        },
    )
    firstName = serializers.CharField(
        max_length=NAME_MAX_LENGTH,
        error_messages={
            "blank": "Nome obbligatorio.",
            "max_length": f"Massimo {NAME_MAX_LENGTH} caratteri.",
            "required": "Nome obbligatorio.",
        },
    )
    lastName = serializers.CharField(
        max_length=NAME_MAX_LENGTH,
        error_messages={
            "blank": "Cognome obbligatorio.",
            "max_length": f"Massimo {NAME_MAX_LENGTH} caratteri.",
            "required": "Cognome obbligatorio.",
        },
    )

    def validate_username(self, value: str) -> str:
        username = clean_required_text(value, "Username obbligatorio.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Username gia in uso.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if email_is_already_used(email):
            raise serializers.ValidationError("Email gia in uso.")
        return email

    def validate_password(self, value: str) -> str:
        check_password_strength(value)
        validate_password(value)
        return value

    def validate_firstName(self, value: str) -> str:
        return clean_required_text(value, "Nome obbligatorio.")

    def validate_lastName(self, value: str) -> str:
        return clean_required_text(value, "Cognome obbligatorio.")

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["firstName"],
            last_name=validated_data["lastName"],
        )


class ProfilePatchSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, max_length=USERNAME_MAX_LENGTH)
    email = serializers.EmailField(required=False, max_length=EMAIL_MAX_LENGTH)
    firstName = serializers.CharField(required=False, max_length=NAME_MAX_LENGTH)
    lastName = serializers.CharField(required=False, max_length=NAME_MAX_LENGTH)

    def validate_username(self, value: str) -> str:
        username = clean_required_text(value, "Username cannot be blank.")
        current_user = self.context["request"].user
        if User.objects.filter(username__iexact=username).exclude(pk=current_user.pk).exists():
            raise serializers.ValidationError("Username already exists.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        current_user = self.context["request"].user
        if email_is_already_used(email, skip_user=current_user):
            raise serializers.ValidationError("Email already exists.")
        return email

    def validate_firstName(self, value: str) -> str:
        return clean_required_text(value, "Nome obbligatorio.")

    def validate_lastName(self, value: str) -> str:
        return clean_required_text(value, "Cognome obbligatorio.")

    def update(self, instance, validated_data):
        changed_fields = []
        field_map = (
            ("username", "username"),
            ("email", "email"),
            ("firstName", "first_name"),
            ("lastName", "last_name"),
        )
        for api_name, model_name in field_map:
            if api_name in validated_data:
                setattr(instance, model_name, validated_data[api_name])
                changed_fields.append(model_name)

        if changed_fields:
            instance.save(update_fields=changed_fields)
        return instance


class PasswordUpdateSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(max_length=PASSWORD_MAX_LENGTH)
    newPassword = serializers.CharField(min_length=8, max_length=PASSWORD_MAX_LENGTH)

    def validate_currentPassword(self, value: str) -> str:
        current_user = self.context["request"].user
        if not current_user.check_password(value):
            raise serializers.ValidationError("Password attuale non corretta.")
        return value

    def validate_newPassword(self, value: str) -> str:
        current_user = self.context["request"].user
        if current_user.check_password(value):
            raise serializers.ValidationError("La nuova password deve essere diversa.")
        check_password_strength(value)
        validate_password(value, current_user)
        return value

    def save(self):
        current_user = self.context["request"].user
        current_user.set_password(self.validated_data["newPassword"])
        current_user.save(update_fields=["password"])
        return current_user


class AvatarFileSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        image = getattr(value, "image", None)
        if value.size > settings.AVATAR_MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("Avatar must be at most 2 MB.")
        if image is None:
            raise serializers.ValidationError("Avatar must be a valid image.")
        if image.format not in settings.AVATAR_ALLOWED_FORMATS:
            raise serializers.ValidationError("Avatar format must be JPEG, PNG, or WEBP.")
        if max(image.size) > settings.AVATAR_MAX_DIMENSION:
            raise serializers.ValidationError("Avatar dimensions must be at most 1024x1024 pixels.")
        return value
