// File: SolverBoard.tsx
// Scopo: Renderizza le righe classifica separando paginazione e caricamento dati.
// Livello: Componente UI funzionalita
// Esporta: SolverBoard
// Dipende da: struttura classifica Challenge, Avatar, Panel, funzioni formattazione

import { formatAverage, formatDisplayName } from "@shared/lib/formatters";
import { Avatar, Panel } from "@shared/ui";

import type { LeaderboardEntry } from "../types";

type SolverBoardProps = {
  entries: LeaderboardEntry[];
};

function SolverRow({ solver }: { solver: LeaderboardEntry }) {
  const fullName = formatDisplayName(solver);

  return (
    <article className="grid gap-4 px-5 py-4 md:grid-cols-[72px_1fr_130px_150px] md:items-center">
      <div className="text-2xl font-black text-lime-300">#{solver.rank}</div>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={solver.avatarUrl} name={fullName} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{fullName}</p>
          <p className="truncate text-sm text-zinc-400">@{solver.username}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 md:hidden">
          Risolte
        </p>
        <p className="font-bold">{solver.solvedCount}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 md:hidden">
          Media tentativi
        </p>
        <p className="font-bold">{formatAverage(solver.averageAttempts)}</p>
      </div>
    </article>
  );
}

export function SolverBoard({ entries: solvers }: SolverBoardProps) {
  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="hidden grid-cols-[72px_1fr_130px_150px] border-b border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 md:grid">
        <span>Pos.</span>
        <span>Utente</span>
        <span>Risolte</span>
        <span>Media tentativi</span>
      </div>
      <div className="divide-y divide-white/10">
        {solvers.map((solver) => (
          <SolverRow key={solver.userId} solver={solver} />
        ))}
      </div>
    </Panel>
  );
}
