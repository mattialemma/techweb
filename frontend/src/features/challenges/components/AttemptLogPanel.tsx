// FILE: AttemptLogPanel.tsx
// Purpose: Shows the current user's attempts for a challenge.
// Layer: Feature UI component
// Exports: AttemptLogPanel
// Depends on: Attempt type, shared Panel

import { renderAttemptScore } from "../attemptFormatters";
import type { Attempt } from "../types";

type AttemptLogPanelProps = {
  attempts: Attempt[];
  isLoading: boolean;
};

export function AttemptLogPanel({ attempts, isLoading }: AttemptLogPanelProps) {
  return (
    <section className="mt-12 min-w-0 border-t border-white/5 pt-7 sm:mt-16 xl:mt-8">
      <h2 className="text-3xl font-black">Registro tentativi</h2>
      {isLoading ? <p className="mt-4 text-base text-zinc-400">Caricamento...</p> : null}
      {!isLoading && attempts.length === 0 ? (
        <p className="mt-4 text-base text-zinc-400">Nessun tentativo inviato.</p>
      ) : null}
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {attempts.map((attempt) => (
          <article
            key={attempt.attemptId}
            className="min-h-40 rounded border border-white/10 bg-zinc-950/48 p-5 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-black">Tentativo {attempt.attemptNumber}</p>
              <span
                className={`rounded px-3 py-2 text-base font-black ${
                  attempt.solved ? "bg-lime-300/15 text-lime-200" : "bg-white/10 text-zinc-300"
                }`}
              >
                {attempt.solved ? "Risolta" : "Parziale"}
              </span>
            </div>
            <p className="mt-6 break-all font-mono text-xl text-zinc-200">{attempt.proposedRegex}</p>
            <p className="mt-5 text-lg text-zinc-400">{renderAttemptScore(attempt)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
