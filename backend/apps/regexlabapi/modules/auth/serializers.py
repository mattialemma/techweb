"""Serializer usati dagli endpoint di autenticazione.

Qui tengo separati i dati in ingresso e in uscita per login, refresh,
CSRF e recupero password. I dati dell'utente restano nel modulo users.
"""

from rest_framework import serializers

from ..users.serializers import PublicUserSerializer
from ..users.serializers import EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH


# --- Dati ricevuti dal frontend --------------------------------------------


class EmailRecoveryRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)


class RecoveryCodeCheckSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    code = serializers.RegexField(regex=r"^\d{6}$")


class PasswordRecoveryApplySerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    code = serializers.RegexField(regex=r"^\d{6}$")
    newPassword = serializers.CharField(min_length=8, max_length=PASSWORD_MAX_LENGTH)


class CredentialsSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=EMAIL_MAX_LENGTH)
    password = serializers.CharField(write_only=True, max_length=PASSWORD_MAX_LENGTH)


# --- Risposte restituite al frontend ---------------------------------------


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class CsrfHandshakeSerializer(serializers.Serializer):
    csrfToken = serializers.CharField()


class AccessTokenSerializer(serializers.Serializer):
    accessToken = serializers.CharField()


class SessionCreatedSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    user = PublicUserSerializer()


class RecoveryCodeStatusSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    expiresAt = serializers.DateTimeField(required=False, allow_null=True)
