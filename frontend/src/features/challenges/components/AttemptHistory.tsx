// FILE: AttemptHistory.tsx
// Purpose: Shows the current user's attempts for a challenge.
// Layer: Feature UI component
// Exports: AttemptHistory, summarizeAttempt
// Depends on: Attempt type, shared Panel

import { Panel } from "@shared/ui";

import { summarizeAttempt } from "../attemptFormatters";
import type { Attempt } from "../types";

type AttemptHistoryProps = {
  attempts: Attempt[];
  isLoading: boolean;
};

export function AttemptHistory({ attempts, isLoading }: AttemptHistoryProps) {
  return (
    <Panel>
      <h2 className="text-xl font-black">Registro tentativi</h2>
      {isLoading ? <p className="mt-3 text-sm text-zinc-400">Caricamento...</p> : null}
      {!isLoading && attempts.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">Nessun tentativo inviato.</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {attempts.map((attempt) => (
          <article key={attempt.attemptId} className="rounded border border-white/10 bg-zinc-950/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Tentativo {attempt.attemptNumber}</p>
              <span
                className={`rounded px-2 py-1 text-xs font-black ${
                  attempt.solved ? "bg-lime-300/15 text-lime-200" : "bg-white/10 text-zinc-300"
                }`}
              >
                {attempt.solved ? "Risolta" : "Parziale"}
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-sm text-zinc-100">{attempt.proposedRegex}</p>
            <p className="mt-2 text-sm text-zinc-400">{summarizeAttempt(attempt)}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
