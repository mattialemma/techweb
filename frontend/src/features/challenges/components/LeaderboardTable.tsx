// FILE: LeaderboardTable.tsx
// Purpose: Renders leaderboard entries separately from pagination and data loading.
// Layer: Feature UI component
// Exports: LeaderboardTable
// Depends on: Challenge leaderboard type shape, Avatar, Panel, formatter helpers

import { formatAverage, formatDisplayName } from "@shared/lib/formatters";
import { Avatar, Panel } from "@shared/ui";

import type { LeaderboardEntry } from "../types";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
};

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="hidden grid-cols-[72px_1fr_130px_150px] border-b border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 md:grid">
        <span>Pos.</span>
        <span>Utente</span>
        <span>Risolte</span>
        <span>Media tentativi</span>
      </div>
      <div className="divide-y divide-white/10">
        {entries.map((entry) => {
          const fullName = formatDisplayName(entry);

          return (
            <article
              key={entry.userId}
              className="grid gap-4 px-5 py-4 md:grid-cols-[72px_1fr_130px_150px] md:items-center"
            >
              <div className="text-2xl font-black text-lime-300">#{entry.rank}</div>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={entry.avatarUrl} name={fullName} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{fullName}</p>
                  <p className="truncate text-sm text-zinc-400">@{entry.username}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 md:hidden">
                  Risolte
                </p>
                <p className="font-bold">{entry.solvedCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 md:hidden">
                  Media tentativi
                </p>
                <p className="font-bold">{formatAverage(entry.averageAttempts)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
