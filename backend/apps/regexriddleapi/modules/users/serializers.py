"""Serializers and validators for user account API payloads.

Owns public user DTOs, registration/update validation, passwords, and avatar upload checks.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .services import account_email_is_taken

User = get_user_model()

USERNAME_MAX_LENGTH = 20
PASSWORD_MAX_LENGTH = 20
EMAIL_MAX_LENGTH = 128
NAME_MAX_LENGTH = 25


def build_avatar_url(user, request=None) -> str | None:
    avatar = getattr(getattr(user, "profile", None), "avatar", None)
    if not avatar:
        return None
    try:
        if not avatar.storage.exists(avatar.name):
            return None
        # Keep media URLs same-origin so Vite/nginx proxies do not leak Docker hostnames.
        return avatar.url
    except ValueError:
        return None


class AccountReadSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source="id", read_only=True)
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("userId", "username", "email", "firstName", "lastName", "avatarUrl")

    def get_avatarUrl(self, user) -> str | None:
        return build_avatar_url(user, self.context.get("request"))


def enforce_password_rules(value: str) -> None:
    if len(value) > PASSWORD_MAX_LENGTH:
        raise serializers.ValidationError("La password puo avere al massimo 20 caratteri.")
    if len(value) < 8:
        raise serializers.ValidationError("La password deve avere almeno 8 caratteri.")
    if not any(character.islower() for character in value):
        raise serializers.ValidationError("La password deve contenere una lettera minuscola.")
    if not any(character.isupper() for character in value):
        raise serializers.ValidationError("La password deve contenere una lettera maiuscola.")
    if not any(character.isdigit() for character in value):
        raise serializers.ValidationError("La password deve contenere un numero.")
    if not any(not character.isalnum() for character in value):
        raise serializers.ValidationError("La password deve contenere un carattere speciale.")


class AccountCreateSerializer(serializers.Serializer):
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
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username obbligatorio.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Username gia in uso.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if account_email_is_taken(email):
            raise serializers.ValidationError("Email gia in uso.")
        return email

    def validate_password(self, value: str) -> str:
        enforce_password_rules(value)
        validate_password(value)
        return value

    def validate_firstName(self, value: str) -> str:
        first_name = value.strip()
        if not first_name:
            raise serializers.ValidationError("Nome obbligatorio.")
        return first_name

    def validate_lastName(self, value: str) -> str:
        last_name = value.strip()
        if not last_name:
            raise serializers.ValidationError("Cognome obbligatorio.")
        return last_name

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["firstName"],
            last_name=validated_data["lastName"],
        )
        return user


class AccountUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, max_length=USERNAME_MAX_LENGTH)
    email = serializers.EmailField(required=False, max_length=EMAIL_MAX_LENGTH)
    firstName = serializers.CharField(required=False, max_length=NAME_MAX_LENGTH)
    lastName = serializers.CharField(required=False, max_length=NAME_MAX_LENGTH)

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username cannot be blank.")
        user = self.context["request"].user
        if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already exists.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        user = self.context["request"].user
        if account_email_is_taken(email, excluding_user=user):
            raise serializers.ValidationError("Email already exists.")
        return email

    def validate_firstName(self, value: str) -> str:
        first_name = value.strip()
        if not first_name:
            raise serializers.ValidationError("Nome obbligatorio.")
        return first_name

    def validate_lastName(self, value: str) -> str:
        last_name = value.strip()
        if not last_name:
            raise serializers.ValidationError("Cognome obbligatorio.")
        return last_name

    def update(self, instance, validated_data):
        update_fields = []
        for input_name, model_name in (
            ("username", "username"),
            ("email", "email"),
            ("firstName", "first_name"),
            ("lastName", "last_name"),
        ):
            if input_name in validated_data:
                setattr(instance, model_name, validated_data[input_name])
                update_fields.append(model_name)
        if update_fields:
            instance.save(update_fields=update_fields)
        return instance


class AccountPasswordChangeSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(max_length=PASSWORD_MAX_LENGTH)
    newPassword = serializers.CharField(min_length=8, max_length=PASSWORD_MAX_LENGTH)

    def validate_currentPassword(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password attuale non corretta.")
        return value

    def validate_newPassword(self, value: str) -> str:
        user = self.context["request"].user
        if user.check_password(value):
            raise serializers.ValidationError("La nuova password deve essere diversa.")
        enforce_password_rules(value)
        validate_password(value, user)
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return user


class AccountAvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        if value.size > settings.AVATAR_MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("Avatar must be at most 2 MB.")
        image = getattr(value, "image", None)
        if image is None:
            raise serializers.ValidationError("Avatar must be a valid image.")
        if image.format not in settings.AVATAR_ALLOWED_FORMATS:
            raise serializers.ValidationError("Avatar format must be JPEG, PNG, or WEBP.")
        if max(image.size) > settings.AVATAR_MAX_DIMENSION:
            raise serializers.ValidationError("Avatar dimensions must be at most 1024x1024 pixels.")
        return value
