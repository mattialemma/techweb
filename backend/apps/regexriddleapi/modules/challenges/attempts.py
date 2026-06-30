"""Attempt creation service for published puzzles.

Owns attempt locking, author/solved checks, scoring, and persistence.
"""

import regex
from django.db import transaction
from rest_framework import serializers

from .models import Attempt, Challenge, ControlStringKind
from .scoring import pattern_accepts_value


@transaction.atomic
def record_attempt_for_challenge(
    *,
    challenge: Challenge,
    solver,
    proposed_regex: str,
) -> Attempt:
    Challenge.objects.select_for_update().get(pk=challenge.pk)

    if challenge.author_id == solver.id:
        raise serializers.ValidationError(
            {"detail": "L'autore non puo risolvere la propria sfida."}
        )

    existing_attempts = Attempt.objects.select_for_update().filter(
        challenge=challenge,
        solver=solver,
    )
    if existing_attempts.filter(solved=True).exists():
        raise serializers.ValidationError(
            {"detail": "Hai gia risolto questa sfida. Non puoi inviare altri tentativi."}
        )

    compiled_proposed_regex = build_attempt_pattern(proposed_regex)
    control_strings = list(challenge.control_strings.all())
    positive_controls = [
        control for control in control_strings if control.kind == ControlStringKind.POSITIVE
    ]
    negative_controls = [
        control for control in control_strings if control.kind == ControlStringKind.NEGATIVE
    ]

    positive_matched = sum(
        1 for control in positive_controls if pattern_accepts_value(compiled_proposed_regex, control.value)
    )
    negative_matched = sum(
        1
        for control in negative_controls
        if not pattern_accepts_value(compiled_proposed_regex, control.value)
    )
    total_positive = len(positive_controls)
    total_negative = len(negative_controls)
    solved = positive_matched == total_positive and negative_matched == total_negative
    attempt_number = existing_attempts.count() + 1

    return Attempt.objects.create(
        challenge=challenge,
        solver=solver,
        proposed_regex=proposed_regex,
        positive_matched=positive_matched,
        negative_matched=negative_matched,
        total_positive=total_positive,
        total_negative=total_negative,
        solved=solved,
        attempt_number=attempt_number,
    )


def build_attempt_pattern(pattern: str) -> regex.Pattern:
    try:
        return regex.compile(pattern)
    except regex.error as exc:
        raise serializers.ValidationError({"proposedRegex": f"Regex non valida: {exc}"}) from exc
