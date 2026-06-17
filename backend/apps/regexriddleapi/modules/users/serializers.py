from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .services import email_exists

User = get_user_model()

USERNAME_MAX_LENGTH = 20
PASSWORD_MAX_LENGTH = 20
EMAIL_MAX_LENGTH = 128
NAME_MAX_LENGTH = 25


def user_avatar_url(user, request=None) -> str | None:
    avatar = getattr(getattr(user, "profile", None), "avatar", None)
    if not avatar:
        return None
    try:
        url = avatar.url
    except ValueError:
        return None
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class UserReadSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source="id", read_only=True)
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("userId", "username", "email", "firstName", "lastName", "avatarUrl")

    def get_avatarUrl(self, user):
        return user_avatar_url(user, self.context.get("request"))


def validate_password_complexity(value: str) -> None:
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


class RegisterUserSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=USERNAME_MAX_LENGTH)
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    password = serializers.CharField(write_only=True, min_length=8, max_length=PASSWORD_MAX_LENGTH)
    firstName = serializers.CharField(required=False, allow_blank=True, max_length=NAME_MAX_LENGTH)
    lastName = serializers.CharField(required=False, allow_blank=True, max_length=NAME_MAX_LENGTH)

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Username already exists.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if email_exists(email):
            raise serializers.ValidationError("Email already exists.")
        return email

    def validate_password(self, value: str) -> str:
        validate_password_complexity(value)
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("firstName", ""),
            last_name=validated_data.get("lastName", ""),
        )
        return user


class UpdateCurrentUserSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, max_length=USERNAME_MAX_LENGTH)
    email = serializers.EmailField(required=False, max_length=EMAIL_MAX_LENGTH)
    firstName = serializers.CharField(required=False, allow_blank=True, max_length=NAME_MAX_LENGTH)
    lastName = serializers.CharField(required=False, allow_blank=True, max_length=NAME_MAX_LENGTH)

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
        if email_exists(email, excluding_user=user):
            raise serializers.ValidationError("Email already exists.")
        return email

    def update(self, instance, validated_data):
        for input_name, model_name in (
            ("username", "username"),
            ("email", "email"),
            ("firstName", "first_name"),
            ("lastName", "last_name"),
        ):
            if input_name in validated_data:
                setattr(instance, model_name, validated_data[input_name])
        instance.save(update_fields=["username", "email", "first_name", "last_name"])
        return instance


class ChangeCurrentPasswordSerializer(serializers.Serializer):
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
        validate_password_complexity(value)
        validate_password(value, user)
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return user


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        if value.size > settings.AVATAR_MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("Avatar must be at most 2 MB.")
        return value
