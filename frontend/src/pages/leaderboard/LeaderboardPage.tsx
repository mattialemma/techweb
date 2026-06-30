import { useState } from "react";

import { useLeaderboard } from "@features/challenges";
import { Avatar, Button, InlineMessage, PageHeader, Panel } from "@shared/ui";

function formatAverage(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatFullName(entry: { firstName: string; lastName: string; username: string }): string {
  return `${entry.firstName} ${entry.lastName}`.trim() || entry.username;
}

export function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useLeaderboard(page);
  const entries = data?.results ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Classifica"
        title="Migliori solver"
        description="La classifica premia chi risolve piu enigmi e, a parita di risultati, chi usa meno tentativi in media."
      />

      {isLoading ? <InlineMessage>Caricamento classifica...</InlineMessage> : null}
      {isError ? (
        <InlineMessage tone="error">Non riesco a caricare la classifica in questo momento.</InlineMessage>
      ) : null}

      {!isLoading && !isError && entries.length === 0 ? (
        <Panel padding="lg">
          <h2 className="text-xl font-bold">Ancora nessun risolutore</h2>
          <p className="mt-2 text-slate-300">
            La classifica si popola quando qualcuno risolve almeno una sfida.
          </p>
        </Panel>
      ) : null}

      {entries.length > 0 ? (
        <Panel padding="none" className="overflow-hidden">
          <div className="hidden grid-cols-[80px_1fr_140px_160px] border-b border-white/10 px-5 py-3 text-sm font-semibold text-slate-400 md:grid">
            <span>Rank</span>
            <span>Nome e cognome</span>
            <span>Risolte</span>
            <span>Media tentativi</span>
          </div>
          <div className="divide-y divide-white/10">
            {entries.map((entry) => {
              const fullName = formatFullName(entry);

              return (
                <article
                  key={entry.userId}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[80px_1fr_140px_160px] md:items-center"
                >
                  <div className="text-2xl font-black text-emerald-300">#{entry.rank}</div>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={entry.avatarUrl} name={fullName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{fullName}</p>
                      <p className="truncate text-sm text-slate-400">@{entry.username}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Risolte
                    </p>
                    <p className="font-bold">{entry.solvedCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Media tentativi
                    </p>
                    <p className="font-bold">{formatAverage(entry.averageAttempts)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {!isLoading && !isError && data && data.count > entries.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Pagina {page} - {data.count} solver totali
          </p>
          <div className="flex gap-2">
            <Button
              disabled={!data.previous}
              variant="secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Precedente
            </Button>
            <Button
              disabled={!data.next}
              variant="secondary"
              onClick={() => setPage((current) => current + 1)}
            >
              Successiva
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
