// File: attemptFormatters.ts
// Scopo: Formatta i feedback dei tentativi usati dai componenti del dettaglio sfida.
// Livello: Utilita funzionalita
// Esporta: formatAttemptSummary, renderAttemptScore

import type { Attempt } from "./types";

type AttemptScoreParts = Pick<
  Attempt,
  "negativeMatched" | "positiveMatched" | "totalNegative" | "totalPositive"
>;

function formatAttemptCounts(score: AttemptScoreParts): string {
  const positive = `${score.positiveMatched}/${score.totalPositive} positivi`;
  const negative = `${score.negativeMatched}/${score.totalNegative} negativi`;
  return `${positive}, ${negative}`;
}

export function formatAttemptSummary(attempt: Attempt): string {
  return formatAttemptCounts(attempt);
}

export const renderAttemptScore = formatAttemptSummary;
