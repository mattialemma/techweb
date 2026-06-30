// FILE: attemptFormatters.ts
// Purpose: Formats attempt feedback strings used by challenge detail components.
// Layer: Feature utility
// Exports: summarizeAttempt

import type { Attempt } from "./types";

export function summarizeAttempt(attempt: Attempt) {
  return `${attempt.positiveMatched}/${attempt.totalPositive} positivi, ${attempt.negativeMatched}/${attempt.totalNegative} negativi`;
}
