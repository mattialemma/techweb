from rest_framework import serializers

from ..users.serializers import AccountReadSerializer
from ..users.serializers import EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH


class CSRFTokenResponseSerializer(serializers.Serializer):
    csrfToken = serializers.CharField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    password = serializers.CharField(write_only=True, max_length=PASSWORD_MAX_LENGTH)


class PasswordOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)


class PasswordOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    code = serializers.RegexField(regex=r"^\d{6}$")


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    code = serializers.RegexField(regex=r"^\d{6}$")
    newPassword = serializers.CharField(min_length=8, max_length=PASSWORD_MAX_LENGTH)


class LoginResponseSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    user = AccountReadSerializer()


class RefreshResponseSerializer(serializers.Serializer):
    accessToken = serializers.CharField()


class DetailResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class PasswordOTPVerifyResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    expiresAt = serializers.DateTimeField(required=False, allow_null=True)
