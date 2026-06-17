from django.db import transaction
from rest_framework import serializers

from ..users.serializers import user_avatar_url
from .models import Attempt, Challenge, ControlString, ControlStringKind
from .services import validate_challenge_regex_rules


class AuthorSummarySerializer(serializers.Serializer):
    userId = serializers.IntegerField(source="id")
    username = serializers.CharField()
    avatarUrl = serializers.SerializerMethodField()

    def get_avatarUrl(self, user):
        return user_avatar_url(user, self.context.get("request"))


class ChallengeReadSerializer(serializers.ModelSerializer):
    challengeId = serializers.IntegerField(source="id", read_only=True)
    author = AuthorSummarySerializer(read_only=True)
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


class ChallengeCreateSerializer(serializers.Serializer):
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
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Il titolo e obbligatorio.")
        return title

    def validate(self, attrs):
        positive_controls, negative_controls = validate_challenge_regex_rules(
            secret_regex=attrs["secretRegex"],
            positive_example=attrs["positiveExample"],
            negative_example=attrs["negativeExample"],
            positive_controls=attrs["positiveControls"],
            negative_controls=attrs["negativeControls"],
        )
        attrs["positiveControls"] = positive_controls
        attrs["negativeControls"] = negative_controls
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        positive_controls = validated_data.pop("positiveControls")
        negative_controls = validated_data.pop("negativeControls")
        author = self.context["request"].user

        challenge = Challenge.objects.create(
            author=author,
            title=validated_data["title"],
            description=validated_data.get("description", ""),
            secret_regex=validated_data["secretRegex"],
            positive_example=validated_data["positiveExample"],
            negative_example=validated_data["negativeExample"],
        )

        ControlString.objects.bulk_create(
            [
                ControlString(
                    challenge=challenge,
                    value=value,
                    kind=ControlStringKind.POSITIVE,
                )
                for value in positive_controls
            ]
            + [
                ControlString(
                    challenge=challenge,
                    value=value,
                    kind=ControlStringKind.NEGATIVE,
                )
                for value in negative_controls
            ]
        )

        return challenge


class AttemptCreateSerializer(serializers.Serializer):
    proposedRegex = serializers.CharField(min_length=1, max_length=20)


class AttemptReadSerializer(serializers.ModelSerializer):
    attemptId = serializers.IntegerField(source="id", read_only=True)
    challengeId = serializers.IntegerField(source="challenge_id", read_only=True)
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


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    userId = serializers.IntegerField()
    username = serializers.CharField()
    avatarUrl = serializers.CharField(allow_null=True)
    solvedCount = serializers.IntegerField()
    averageAttempts = serializers.FloatField()
