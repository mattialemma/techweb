"""Puzzle rule validation utilities.

Owns secret regex compilation and create-puzzle consistency checks.
"""

from collections.abc import Iterable

import regex
from rest_framework import serializers

from .scoring import pattern_accepts_value


def verify_challenge_rule_set(
    *,
    secret_regex: str,
    positive_example: str,
    negative_example: str,
    positive_controls: Iterable[str],
    negative_controls: Iterable[str],
) -> tuple[list[str], list[str]]:
    compiled_regex = build_secret_pattern(secret_regex)

    if not pattern_accepts_value(compiled_regex, positive_example):
        raise serializers.ValidationError(
            {"positiveExample": "L'esempio positivo deve soddisfare la regex."}
        )

    if pattern_accepts_value(compiled_regex, negative_example):
        raise serializers.ValidationError(
            {"negativeExample": "L'esempio negativo non deve soddisfare la regex."}
        )

    normalized_positive_controls = collect_control_strings(
        positive_controls,
        field_name="positiveControls",
    )
    normalized_negative_controls = collect_control_strings(
        negative_controls,
        field_name="negativeControls",
    )

    invalid_positive = [
        value for value in normalized_positive_controls if not pattern_accepts_value(compiled_regex, value)
    ]
    if invalid_positive:
        raise serializers.ValidationError(
            {"positiveControls": "Tutti i controlli positivi devono soddisfare la regex."}
        )

    invalid_negative = [
        value for value in normalized_negative_controls if pattern_accepts_value(compiled_regex, value)
    ]
    if invalid_negative:
        raise serializers.ValidationError(
            {"negativeControls": "Tutti i controlli negativi non devono soddisfare la regex."}
        )

    return normalized_positive_controls, normalized_negative_controls


def collect_control_strings(values: Iterable[str], *, field_name: str) -> list[str]:
    normalized_values = list(values)
    if len(normalized_values) < 1:
        raise serializers.ValidationError({field_name: "Inserisci almeno una stringa di controllo."})
    if len(normalized_values) > 10:
        raise serializers.ValidationError({field_name: "Puoi inserire al massimo 10 stringhe."})
    return normalized_values


def build_secret_pattern(pattern: str) -> regex.Pattern:
    try:
        return regex.compile(pattern)
    except regex.error as exc:
        raise serializers.ValidationError({"secretRegex": f"Regex non valida: {exc}"}) from exc
