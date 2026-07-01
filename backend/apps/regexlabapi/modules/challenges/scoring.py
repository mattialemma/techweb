"""Controlli sicuri sulle regex usate nelle sfide.

Centralizzo qui il fullmatch con timeout, cosi creazione sfide e tentativi
usano la stessa protezione contro regex troppo lente.
"""

import regex
from django.conf import settings
from rest_framework import serializers


def regex_matches_text(compiled_pattern: regex.Pattern, text: str) -> bool:
    """Esegue il match completo rispettando il limite di tempo configurato."""
    try:
        match = compiled_pattern.fullmatch(
            text,
            timeout=settings.CHALLENGE_REGEX_TIMEOUT_SECONDS,
        )
        return match is not None
    except TimeoutError as exc:
        raise serializers.ValidationError(
            {"detail": "Regex troppo complessa: la valutazione ha superato il limite di tempo."}
        ) from exc
