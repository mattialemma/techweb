import { useLeaderboard } from "@features/challenges";
import { Avatar, InlineMessage } from "@shared/ui";

function formatAverage(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function LeaderboardPage() {
  const { data: entries = [], isLoading, isError } = useLeaderboard();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Classifica
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Migliori solver</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          La classifica premia chi risolve piu enigmi e, a parita di risultati, chi usa meno
          tentativi in media.
        </p>
      </div>

      {isLoading ? <InlineMessage>Caricamento classifica...</InlineMessage> : null}
      {isError ? (
        <InlineMessage tone="error">Non riesco a caricare la classifica in questo momento.</InlineMessage>
      ) : null}

      {!isLoading && !isError && entries.length === 0 ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">Ancora nessun risolutore</h2>
          <p className="mt-2 text-slate-300">
            La classifica si popola quando qualcuno risolve almeno una sfida.
          </p>
        </section>
      ) : null}

      {entries.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <div className="hidden grid-cols-[80px_1fr_140px_160px] border-b border-white/10 px-5 py-3 text-sm font-semibold text-slate-400 md:grid">
            <span>Rank</span>
            <span>Utente</span>
            <span>Risolte</span>
            <span>Media tentativi</span>
          </div>
          <div className="divide-y divide-white/10">
            {entries.map((entry) => (
              <article
                key={entry.userId}
                className="grid gap-4 px-5 py-4 md:grid-cols-[80px_1fr_140px_160px] md:items-center"
              >
                <div className="text-2xl font-black text-emerald-300">#{entry.rank}</div>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={entry.avatarUrl} name={entry.username} size="md" />
                  <p className="truncate font-semibold">{entry.username}</p>
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
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
