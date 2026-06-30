// FILE: RegexWorkbenchPanel.tsx
// Purpose: Owns the attempt form UI and solved/author states for a challenge.
// Layer: Feature UI component
// Exports: RegexWorkbenchPanel
// Depends on: shared form controls, validation limits, Attempt type

import type { FormEvent } from "react";

import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, FormField, InlineMessage, Input, Panel } from "@shared/ui";

import { renderAttemptScore } from "../attemptFormatters";
import type { Attempt } from "../types";

type RegexWorkbenchPanelProps = {
  fieldError: string;
  hasSolvedChallenge: boolean;
  isAuthor: boolean;
  isSubmitting: boolean;
  lastAttempt: Attempt | null;
  onRegexChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  proposedRegex: string;
  solvedAttemptNumber?: number;
  submitError: string;
};

export function RegexWorkbenchPanel({
  fieldError,
  hasSolvedChallenge,
  isAuthor,
  isSubmitting,
  lastAttempt,
  onRegexChange,
  onSubmit,
  proposedRegex,
  solvedAttemptNumber,
  submitError,
}: RegexWorkbenchPanelProps) {
  return (
    <Panel padding="lg" className="mx-auto w-full max-w-[560px]">
      <h2 className="text-3xl font-black">Banco di prova</h2>
      {isAuthor ? (
        <div className="mt-6">
          <InlineMessage tone="info">
            Sei l'autore della sfida: puoi vederla, ma non puoi inviare tentativi.
          </InlineMessage>
        </div>
      ) : hasSolvedChallenge ? (
        <div className="mt-6">
          <InlineMessage tone="success">
            {`Hai gia risolto questa sfida al tentativo ${solvedAttemptNumber}.`}
          </InlineMessage>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
          {lastAttempt ? (
            <InlineMessage tone="info">{`Feedback: ${renderAttemptScore(lastAttempt)}.`}</InlineMessage>
          ) : null}
          <FormField label="Regex proposta" error={fieldError}>
            <Input
              className="min-h-16 border-white/30 bg-white px-5 font-mono text-xl font-semibold text-zinc-800 shadow-lg shadow-black/25 placeholder:text-zinc-500 hover:border-white/50 focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-300/25"
              value={proposedRegex}
              maxLength={VALIDATION_LIMITS.regex}
              placeholder="^[A-Z]{2}[0-9]{3}$"
              onChange={(event) => onRegexChange(event.target.value)}
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting} className="min-h-16 w-full text-xl">
            Verifica regex
          </Button>
        </form>
      )}
    </Panel>
  );
}
