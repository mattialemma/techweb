"""Servizio per salvare un tentativo di soluzione.

La view passa sfida, utente e regex proposta; qui blocco i casi non validi,
calcolo il punteggio e creo la riga ``Attempt``.
"""

import regex
from django.db import transaction
from rest_framework import serializers

from .models import Attempt, Challenge, ControlStringKind
from .scoring import regex_matches_text


@transaction.atomic
def save_solution_try(
    *,
    challenge: Challenge,
    solver,
    proposed_regex: str,
) -> Attempt:
    """Registra un tentativo e restituisce il risultato da mostrare al frontend."""
    Challenge.objects.select_for_update().get(pk=challenge.pk)

    previous_tries = Attempt.objects.select_for_update().filter(
        challenge=challenge,
        solver=solver,
    )
    ensure_solver_can_try(challenge=challenge, solver=solver, previous_tries=previous_tries)

    candidate_pattern = compile_candidate_regex(proposed_regex)
    positive_controls, negative_controls = split_controls_by_kind(challenge)
    positive_hits = count_matching_controls(candidate_pattern, positive_controls)
    negative_hits = count_rejected_controls(candidate_pattern, negative_controls)
    is_solved = positive_hits == len(positive_controls) and negative_hits == len(negative_controls)

    return Attempt.objects.create(
        challenge=challenge,
        solver=solver,
        proposed_regex=proposed_regex,
        positive_matched=positive_hits,
        negative_matched=negative_hits,
        total_positive=len(positive_controls),
        total_negative=len(negative_controls),
        solved=is_solved,
        attempt_number=previous_tries.count() + 1,
    )


def ensure_solver_can_try(*, challenge: Challenge, solver, previous_tries) -> None:
    """Impedisco all'autore o a chi ha gia risolto di inviare altri tentativi."""
    if challenge.author_id == solver.id:
        raise serializers.ValidationError(
            {"detail": "L'autore non puo risolvere la propria sfida."}
        )

    if previous_tries.filter(solved=True).exists():
        raise serializers.ValidationError(
            {"detail": "Hai gia risolto questa sfida. Non puoi inviare altri tentativi."}
        )


def split_controls_by_kind(challenge: Challenge) -> tuple[list, list]:
    """Divido le stringhe nascoste in positive e negative una sola volta."""
    controls = list(challenge.control_strings.all())
    positives = [item for item in controls if item.kind == ControlStringKind.POSITIVE]
    negatives = [item for item in controls if item.kind == ControlStringKind.NEGATIVE]
    return positives, negatives


def count_matching_controls(compiled_pattern: regex.Pattern, controls: list) -> int:
    return sum(1 for item in controls if regex_matches_text(compiled_pattern, item.value))


def count_rejected_controls(compiled_pattern: regex.Pattern, controls: list) -> int:
    return sum(1 for item in controls if not regex_matches_text(compiled_pattern, item.value))


def compile_candidate_regex(pattern: str) -> regex.Pattern:
    """Compila la regex proposta dal giocatore e segnala gli errori sul campo giusto."""
    try:
        return regex.compile(pattern)
    except regex.error as exc:
        raise serializers.ValidationError({"proposedRegex": f"Regex non valida: {exc}"}) from exc
