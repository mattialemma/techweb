"""Persistence models for regex challenges, hidden controls, and solve attempts."""

from django.conf import settings
from django.db import models


class Challenge(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="challenges",
    )
    title = models.CharField(max_length=45)
    description = models.CharField(max_length=256, blank=True)
    secret_regex = models.CharField(max_length=20)
    positive_example = models.CharField(max_length=20)
    negative_example = models.CharField(max_length=20)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["is_published", "-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class ControlStringKind(models.TextChoices):
    POSITIVE = "positive", "Positive"
    NEGATIVE = "negative", "Negative"


class ControlString(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="control_strings",
    )
    value = models.CharField(max_length=20)
    kind = models.CharField(max_length=8, choices=ControlStringKind.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["challenge", "kind"]),
        ]

    def __str__(self) -> str:
        return f"{self.kind} control for {self.challenge_id}"


class Attempt(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    solver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="challenge_attempts",
    )
    proposed_regex = models.CharField(max_length=20)
    positive_matched = models.PositiveSmallIntegerField()
    negative_matched = models.PositiveSmallIntegerField()
    total_positive = models.PositiveSmallIntegerField()
    total_negative = models.PositiveSmallIntegerField()
    solved = models.BooleanField(default=False)
    attempt_number = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["challenge", "solver", "-created_at"]),
            models.Index(fields=["solver", "solved"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Attempt {self.attempt_number} by {self.solver_id} on {self.challenge_id}"
