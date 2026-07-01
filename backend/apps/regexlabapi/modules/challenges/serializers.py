"""Serializer delle sfide e dei tentativi.

Mantengo qui il contratto JSON usato dal frontend. I nomi delle classi sono
interni al backend, mentre i campi esposti restano invariati.
"""

from django.db import transaction
from rest_framework import serializers

from ..users.serializers import avatar_url_for_user
from .models import Attempt, Challenge, ControlString, ControlStringKind
from .rules import validate_new_challenge_rules


# --- Piccoli blocchi di risposta -------------------------------------------


class PlayerPreviewSerializer(serializers.Serializer):
    userId = serializers.IntegerField(source="id")
    username = serializers.CharField()
    avatarUrl = serializers.SerializerMethodField()

    def get_avatarUrl(self, user) -> str | None:
        return avatar_url_for_user(user, self.context.get("request"))


class ChallengeCardSerializer(serializers.ModelSerializer):
    challengeId = serializers.IntegerField(source="id", read_only=True)
    author = PlayerPreviewSerializer(read_only=True)
    positiveExample = serializers.CharField(source="positive_example", read_only=True)
    negativeExample = serializers.CharField(source="negative_example", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Challenge
        fields = (
            "challengeId",
            "title",
            "description",
            "author",
            "positiveExample",
            "negativeExample",
            "createdAt",
        )


class TryResultSerializer(serializers.ModelSerializer):
    attemptId = serializers.IntegerField(source="id", read_only=True)
    challengeId = serializers.IntegerField(source="challenge.id", read_only=True)
    proposedRegex = serializers.CharField(source="proposed_regex", read_only=True)
    positiveMatched = serializers.IntegerField(source="positive_matched", read_only=True)
    negativeMatched = serializers.IntegerField(source="negative_matched", read_only=True)
    totalPositive = serializers.IntegerField(source="total_positive", read_only=True)
    totalNegative = serializers.IntegerField(source="total_negative", read_only=True)
    attemptNumber = serializers.IntegerField(source="attempt_number", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Attempt
        fields = (
            "attemptId",
            "challengeId",
            "proposedRegex",
            "positiveMatched",
            "negativeMatched",
            "totalPositive",
            "totalNegative",
            "solved",
            "attemptNumber",
            "createdAt",
        )


class RankingLineSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    userId = serializers.IntegerField()
    username = serializers.CharField()
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    avatarUrl = serializers.CharField(allow_null=True)
    solvedCount = serializers.IntegerField()
    averageAttempts = serializers.FloatField()


# --- Dati ricevuti dal frontend --------------------------------------------


class ChallengeDraftSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=45)
    description = serializers.CharField(required=False, allow_blank=True, max_length=256)
    secretRegex = serializers.CharField(max_length=20)
    positiveExample = serializers.CharField(allow_blank=True, max_length=20)
    negativeExample = serializers.CharField(allow_blank=True, max_length=20)
    positiveControls = serializers.ListField(
        child=serializers.CharField(allow_blank=True, max_length=20),
        allow_empty=False,
    )
    negativeControls = serializers.ListField(
        child=serializers.CharField(allow_blank=True, max_length=20),
        allow_empty=False,
    )

    def validate_title(self, value: str) -> str:
        clean_title = value.strip()
        if not clean_title:
            raise serializers.ValidationError("Il titolo e obbligatorio.")
        return clean_title

    def validate(self, attrs):
        validate_new_challenge_rules(
            secret_regex=attrs["secretRegex"],
            positive_example=attrs["positiveExample"],
            negative_example=attrs["negativeExample"],
            positive_controls=attrs["positiveControls"],
            negative_controls=attrs["negativeControls"],
        )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        positives = validated_data.pop("positiveControls")
        negatives = validated_data.pop("negativeControls")
        author = self.context["request"].user

        new_challenge = Challenge.objects.create(
            author=author,
            title=validated_data["title"],
            description=validated_data.get("description", ""),
            secret_regex=validated_data["secretRegex"],
            positive_example=validated_data["positiveExample"],
            negative_example=validated_data["negativeExample"],
        )

        hidden_controls = build_hidden_controls(new_challenge, positives, negatives)
        ControlString.objects.bulk_create(hidden_controls)
        return new_challenge


class TryDraftSerializer(serializers.Serializer):
    proposedRegex = serializers.CharField(min_length=1, max_length=20)


def build_hidden_controls(
    challenge: Challenge,
    positive_values: list[str],
    negative_values: list[str],
) -> list[ControlString]:
    """Preparo le stringhe di controllo da inserire in bulk."""
    positive_rows = [
        ControlString(
            challenge=challenge,
            value=value,
            kind=ControlStringKind.POSITIVE,
        )
        for value in positive_values
    ]
    negative_rows = [
        ControlString(
            challenge=challenge,
            value=value,
            kind=ControlStringKind.NEGATIVE,
        )
        for value in negative_values
    ]
    return positive_rows + negative_rows
