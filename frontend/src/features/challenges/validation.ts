import type { CreateChallengePayload } from "./types";
import {
  VALIDATION_LIMITS,
  maxLength,
  validateRegexSyntax,
} from "@shared/lib/validation";

export type ChallengeValidationErrors = Partial<Record<keyof CreateChallengePayload, string>>;

function compileRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function fullMatches(regex: RegExp, value: string): boolean {
  const flags = regex.flags.replace("g", "");
  const source = regex.source;
  const anchored = new RegExp(`^(?:${source})$`, flags);
  return anchored.test(value);
}

function validateControls(values: string[]) {
  if (values.length < 1) return "Inserisci almeno una stringa di controllo.";
  if (values.length > VALIDATION_LIMITS.maxControlsPerKind) {
    return `Puoi inserire al massimo ${VALIDATION_LIMITS.maxControlsPerKind} stringhe.`;
  }
  if (values.some((value) => value.length > VALIDATION_LIMITS.control)) {
    return `Ogni controllo deve restare sotto ${VALIDATION_LIMITS.control} caratteri.`;
  }
  return null;
}

export function validateChallengePayload(values: CreateChallengePayload): ChallengeValidationErrors {
  const errors: ChallengeValidationErrors = {};
  const regex = compileRegex(values.secretRegex);

  const titleError = maxLength(values.title.trim(), VALIDATION_LIMITS.challengeTitle);
  const descriptionError = maxLength(values.description, VALIDATION_LIMITS.challengeDescription);
  const regexLengthError = maxLength(values.secretRegex, VALIDATION_LIMITS.regex);
  const positiveExampleError = maxLength(values.positiveExample, VALIDATION_LIMITS.example);
  const negativeExampleError = maxLength(values.negativeExample, VALIDATION_LIMITS.example);

  if (!values.title.trim()) errors.title = "Titolo obbligatorio.";
  if (titleError) errors.title = titleError;
  if (descriptionError) errors.description = descriptionError;
  if (!values.secretRegex) errors.secretRegex = "Regex obbligatoria.";
  if (regexLengthError) errors.secretRegex = regexLengthError;
  if (values.secretRegex && !regex && !errors.secretRegex) errors.secretRegex = "Regex non valida.";
  if (positiveExampleError) errors.positiveExample = positiveExampleError;
  if (negativeExampleError) errors.negativeExample = negativeExampleError;

  const positiveControlsError = validateControls(values.positiveControls);
  const negativeControlsError = validateControls(values.negativeControls);
  if (positiveControlsError) errors.positiveControls = positiveControlsError;
  if (negativeControlsError) errors.negativeControls = negativeControlsError;

  if (regex && !errors.positiveExample && !errors.negativeExample) {
    if (!fullMatches(regex, values.positiveExample)) {
      errors.positiveExample = "L'esempio positivo deve soddisfare la regex.";
    }
    if (fullMatches(regex, values.negativeExample)) {
      errors.negativeExample = "L'esempio negativo non deve soddisfare la regex.";
    }
    if (values.positiveControls.some((value) => !fullMatches(regex, value))) {
      errors.positiveControls = "Tutti i controlli positivi devono soddisfare la regex.";
    }
    if (values.negativeControls.some((value) => fullMatches(regex, value))) {
      errors.negativeControls = "Tutti i controlli negativi non devono soddisfare la regex.";
    }
  }

  return errors;
}

export function validateProposedRegex(value: string): string | null {
  if (!value.trim()) return "Inserisci almeno un carattere.";
  const lengthError = maxLength(value, VALIDATION_LIMITS.regex);
  if (lengthError) return lengthError;
  return validateRegexSyntax(value);
}
