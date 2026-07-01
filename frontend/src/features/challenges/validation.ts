// File: validation.ts
// Scopo: Valida bozze sfida e regex proposte senza modificare i dati inseriti.
// Livello: Validazione feature
// Esporta: inspectPuzzleDraft, inspectSubmittedPattern

import {
  VALIDATION_LIMITS,
  maxLength,
  validateRegexSyntax,
} from "@shared/lib/validation";
import type { CreateChallengePayload } from "./types";

export type ChallengeValidationErrors = Partial<Record<keyof CreateChallengePayload, string>>;

function compileCandidatePattern(patternSource: string): RegExp | null {
  try {
    return new RegExp(patternSource);
  } catch {
    return null;
  }
}

function matchesFullSample(candidate: RegExp, sampleValue: string): boolean {
  const nonGlobalFlags = candidate.flags.replace("g", "");
  const anchoredCandidate = new RegExp(`^(?:${candidate.source})$`, nonGlobalFlags);
  return anchoredCandidate.test(sampleValue);
}

function inspectHiddenControls(controlValues: string[]) {
  if (controlValues.length < 1) return "Inserisci almeno una stringa di controllo.";
  if (controlValues.length > VALIDATION_LIMITS.maxControlsPerKind) {
    return `Puoi inserire al massimo ${VALIDATION_LIMITS.maxControlsPerKind} stringhe.`;
  }
  if (controlValues.some((controlValue) => controlValue.length > VALIDATION_LIMITS.control)) {
    return `Ogni controllo deve restare sotto ${VALIDATION_LIMITS.control} caratteri.`;
  }
  return null;
}

function applyBasicDraftErrors(
  draft: CreateChallengePayload,
  errors: ChallengeValidationErrors,
): RegExp | null {
  const compiledRegex = compileCandidatePattern(draft.secretRegex);
  const titleError = maxLength(draft.title.trim(), VALIDATION_LIMITS.challengeTitle);
  const descriptionError = maxLength(draft.description, VALIDATION_LIMITS.challengeDescription);
  const regexLengthError = maxLength(draft.secretRegex, VALIDATION_LIMITS.regex);
  const positiveExampleError = maxLength(draft.positiveExample, VALIDATION_LIMITS.example);
  const negativeExampleError = maxLength(draft.negativeExample, VALIDATION_LIMITS.example);

  if (!draft.title.trim()) errors.title = "Titolo obbligatorio.";
  if (titleError) errors.title = titleError;
  if (descriptionError) errors.description = descriptionError;
  if (!draft.secretRegex) errors.secretRegex = "Regex obbligatoria.";
  if (regexLengthError) errors.secretRegex = regexLengthError;
  if (draft.secretRegex && !compiledRegex && !errors.secretRegex) errors.secretRegex = "Regex non valida.";
  if (positiveExampleError) errors.positiveExample = positiveExampleError;
  if (negativeExampleError) errors.negativeExample = negativeExampleError;

  return compiledRegex;
}

function applyControlErrors(
  draft: CreateChallengePayload,
  errors: ChallengeValidationErrors,
): void {
  const positiveControlsError = inspectHiddenControls(draft.positiveControls);
  const negativeControlsError = inspectHiddenControls(draft.negativeControls);

  if (positiveControlsError) errors.positiveControls = positiveControlsError;
  if (negativeControlsError) errors.negativeControls = negativeControlsError;
}

function applyRegexMatchErrors(
  draft: CreateChallengePayload,
  compiledRegex: RegExp,
  errors: ChallengeValidationErrors,
): void {
  if (errors.positiveExample || errors.negativeExample) return;

  if (!matchesFullSample(compiledRegex, draft.positiveExample)) {
    errors.positiveExample = "L'esempio positivo deve soddisfare la regex.";
  }
  if (matchesFullSample(compiledRegex, draft.negativeExample)) {
    errors.negativeExample = "L'esempio negativo non deve soddisfare la regex.";
  }
  if (draft.positiveControls.some((controlValue) => !matchesFullSample(compiledRegex, controlValue))) {
    errors.positiveControls = "Tutti i controlli positivi devono soddisfare la regex.";
  }
  if (draft.negativeControls.some((controlValue) => matchesFullSample(compiledRegex, controlValue))) {
    errors.negativeControls = "Tutti i controlli negativi non devono soddisfare la regex.";
  }
}

export function inspectPuzzleDraft(draft: CreateChallengePayload): ChallengeValidationErrors {
  const errors: ChallengeValidationErrors = {};
  const compiledRegex = applyBasicDraftErrors(draft, errors);

  applyControlErrors(draft, errors);
  if (compiledRegex) applyRegexMatchErrors(draft, compiledRegex, errors);

  return errors;
}

export function inspectSubmittedPattern(candidatePattern: string): string | null {
  if (!candidatePattern.trim()) return "Inserisci almeno un carattere.";
  const lengthError = maxLength(candidatePattern, VALIDATION_LIMITS.regex);
  if (lengthError) return lengthError;
  return validateRegexSyntax(candidatePattern);
}
