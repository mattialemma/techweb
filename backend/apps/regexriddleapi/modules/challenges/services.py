import re
from collections.abc import Iterable

from django.db import transaction
from rest_framework import serializers

from .models import Attempt, Challenge, ControlStringKind


def compile_regex(pattern: str) -> re.Pattern[str]:
    try:
        return re.compile(pattern)
    except re.error as exc:
        raise serializers.ValidationError({"secretRegex": f"Regex non valida: {exc}"}) from exc


def compile_proposed_regex(pattern: str) -> re.Pattern[str]:
    try:
        return re.compile(pattern)
    except re.error as exc:
        raise serializers.ValidationError({"proposedRegex": f"Regex non valida: {exc}"}) from exc


def regex_fullmatches(compiled_regex: re.Pattern[str], value: str) -> bool:
    return compiled_regex.fullmatch(value) is not None


def validate_control_count(values: Iterable[str], *, field_name: str) -> list[str]:
    normalized_values = list(values)
    if len(normalized_values) < 1:
        raise serializers.ValidationError({field_name: "Inserisci almeno una stringa di controllo."})
    if len(normalized_values) > 10:
        raise serializers.ValidationError({field_name: "Puoi inserire al massimo 10 stringhe."})
    return normalized_values


def validate_challenge_regex_rules(
    *,
    secret_regex: str,
    positive_example: str,
    negative_example: str,
    positive_controls: Iterable[str],
    negative_controls: Iterable[str],
) -> tuple[list[str], list[str]]:
    compiled_regex = compile_regex(secret_regex)

    if not regex_fullmatches(compiled_regex, positive_example):
        raise serializers.ValidationError(
            {"positiveExample": "L'esempio positivo deve soddisfare la regex."}
        )

    if regex_fullmatches(compiled_regex, negative_example):
        raise serializers.ValidationError(
            {"negativeExample": "L'esempio negativo non deve soddisfare la regex."}
        )

    normalized_positive_controls = validate_control_count(
        positive_controls,
        field_name="positiveControls",
    )
    normalized_negative_controls = validate_control_count(
        negative_controls,
        field_name="negativeControls",
    )

    invalid_positive = [
        value for value in normalized_positive_controls if not regex_fullmatches(compiled_regex, value)
    ]
    if invalid_positive:
        raise serializers.ValidationError(
            {"positiveControls": "Tutti i controlli positivi devono soddisfare la regex."}
        )

    invalid_negative = [
        value for value in normalized_negative_controls if regex_fullmatches(compiled_regex, value)
    ]
    if invalid_negative:
        raise serializers.ValidationError(
            {"negativeControls": "Tutti i controlli negativi non devono soddisfare la regex."}
        )

    return normalized_positive_controls, normalized_negative_controls


@transaction.atomic
def create_attempt_for_challenge(
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

    compiled_proposed_regex = compile_proposed_regex(proposed_regex)
    control_strings = list(challenge.control_strings.all())
    positive_controls = [
        control for control in control_strings if control.kind == ControlStringKind.POSITIVE
    ]
    negative_controls = [
        control for control in control_strings if control.kind == ControlStringKind.NEGATIVE
    ]

    positive_matched = sum(
        1 for control in positive_controls if regex_fullmatches(compiled_proposed_regex, control.value)
    )
    negative_matched = sum(
        1
        for control in negative_controls
        if not regex_fullmatches(compiled_proposed_regex, control.value)
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
