"""Regex scoring helpers for puzzle creation and attempts.

Owns safe full-match evaluation with the configured timeout.
"""

import regex
from django.conf import settings
from rest_framework import serializers


def pattern_accepts_value(compiled_regex: regex.Pattern, value: str) -> bool:
    try:
        return (
            compiled_regex.fullmatch(
                value,
                timeout=settings.CHALLENGE_REGEX_TIMEOUT_SECONDS,
            )
            is not None
        )
    except TimeoutError as exc:
        raise serializers.ValidationError(
            {"detail": "Regex troppo complessa: la valutazione ha superato il limite di tempo."}
        ) from exc
