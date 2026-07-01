"""Validazioni usate quando un utente crea una nuova sfida.

Qui controllo che esempi e stringhe nascoste siano coerenti con la regex
segreta, prima di salvare qualsiasi dato nel database.
"""

from collections.abc import Iterable

import regex
from rest_framework import serializers

from .scoring import regex_matches_text


def validate_new_challenge_rules(
    *,
    secret_regex: str,
    positive_example: str,
    negative_example: str,
    positive_controls: Iterable[str],
    negative_controls: Iterable[str],
) -> tuple[list[str], list[str]]:
    """Verifica esempi e controlli nascosti rispetto alla regex segreta."""
    secret_pattern = compile_secret_regex(secret_regex)

    if not regex_matches_text(secret_pattern, positive_example):
        raise serializers.ValidationError(
            {"positiveExample": "L'esempio positivo deve soddisfare la regex."}
        )

    if regex_matches_text(secret_pattern, negative_example):
        raise serializers.ValidationError(
            {"negativeExample": "L'esempio negativo non deve soddisfare la regex."}
        )

    positives = normalize_controls(
        positive_controls,
        field_name="positiveControls",
    )
    negatives = normalize_controls(
        negative_controls,
        field_name="negativeControls",
    )

    if any(not regex_matches_text(secret_pattern, value) for value in positives):
        raise serializers.ValidationError(
            {"positiveControls": "Tutti i controlli positivi devono soddisfare la regex."}
        )

    if any(regex_matches_text(secret_pattern, value) for value in negatives):
        raise serializers.ValidationError(
            {"negativeControls": "Tutti i controlli negativi non devono soddisfare la regex."}
        )

    return positives, negatives


def normalize_controls(values: Iterable[str], *, field_name: str) -> list[str]:
    """Tengo il controllo sul numero di stringhe ricevute dal frontend."""
    controls = list(values)
    if len(controls) < 1:
        raise serializers.ValidationError({field_name: "Inserisci almeno una stringa di controllo."})
    if len(controls) > 10:
        raise serializers.ValidationError({field_name: "Puoi inserire al massimo 10 stringhe."})
    return controls


def compile_secret_regex(pattern: str) -> regex.Pattern:
    """Compila la regex della sfida e traduce gli errori in messaggi API."""
    try:
        return regex.compile(pattern)
    except regex.error as exc:
        raise serializers.ValidationError({"secretRegex": f"Regex non valida: {exc}"}) from exc
