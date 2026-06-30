// FILE: AttemptSolverPanel.tsx
// Purpose: Owns the attempt form UI and solved/author states for a challenge.
// Layer: Feature UI component
// Exports: AttemptSolverPanel
// Depends on: shared form controls, validation limits, Attempt type

import type { FormEvent } from "react";

import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, FormField, InlineMessage, Input, Panel } from "@shared/ui";

import { summarizeAttempt } from "../attemptFormatters";
import type { Attempt } from "../types";

type AttemptSolverPanelProps = {
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

export function AttemptSolverPanel({
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
}: AttemptSolverPanelProps) {
  return (
    <Panel>
      <h2 className="text-xl font-black">Banco di prova</h2>
      {isAuthor ? (
        <InlineMessage tone="info">
          Sei l'autore della sfida: puoi vederla, ma non puoi inviare tentativi.
        </InlineMessage>
      ) : hasSolvedChallenge ? (
        <InlineMessage tone="success">
          {`Hai gia risolto questa sfida al tentativo ${solvedAttemptNumber}.`}
        </InlineMessage>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
          {lastAttempt ? (
            <InlineMessage tone="info">{`Feedback: ${summarizeAttempt(lastAttempt)}.`}</InlineMessage>
          ) : null}
          <FormField label="Regex proposta" error={fieldError}>
            <Input
              value={proposedRegex}
              maxLength={VALIDATION_LIMITS.regex}
              placeholder="^[A-Z]{2}[0-9]{3}$"
              onChange={(event) => onRegexChange(event.target.value)}
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Verifica regex
          </Button>
        </form>
      )}
    </Panel>
  );
}
