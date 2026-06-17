import { Link } from "react-router-dom";

import { useChallenges } from "@features/challenges";
import { Avatar, Button, InlineMessage } from "@shared/ui";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ChallengesPage() {
  const { data: challenges = [], isLoading, isError } = useChallenges();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Sfide
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Regex riddle pubblicati</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            Consulta gli enigmi disponibili. Le regex segrete e i controlli restano nascosti.
          </p>
        </div>
        <Link to="/challenges/new">
          <Button className="w-full sm:w-auto">Nuova sfida</Button>
        </Link>
      </div>

      <section className="mt-8">
        {isLoading ? <InlineMessage>Caricamento sfide...</InlineMessage> : null}
        {isError ? (
          <InlineMessage tone="error">Non riesco a caricare le sfide in questo momento.</InlineMessage>
        ) : null}
        {!isLoading && !isError && challenges.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-bold">Nessuna sfida ancora</h2>
            <p className="mt-2 text-slate-300">Crea il primo enigma e rendi utile questa pagina.</p>
            <Link to="/challenges/new" className="mt-5 inline-block">
              <Button>Crea sfida</Button>
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <Link
              key={challenge.challengeId}
              to={`/challenges/${challenge.challengeId}`}
              className="flex min-h-64 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={challenge.author.avatarUrl}
                    name={challenge.author.username}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{challenge.author.username}</p>
                    <p className="text-xs text-slate-400">{formatDate(challenge.createdAt)}</p>
                  </div>
                </div>
                <h2 className="mt-5 break-words text-xl font-bold [overflow-wrap:anywhere]">
                  {challenge.title}
                </h2>
                {challenge.description ? (
                  <p className="mt-3 line-clamp-3 break-words leading-7 text-slate-300 [overflow-wrap:anywhere]">
                    {challenge.description}
                  </p>
                ) : (
                  <p className="mt-3 text-slate-500">Nessuna descrizione.</p>
                )}
              </div>
              <div className="mt-5 grid gap-2 font-mono text-sm">
                <div className="break-all rounded-md border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                  + {challenge.positiveExample || "<stringa vuota>"}
                </div>
                <div className="break-all rounded-md border border-red-300/15 bg-red-300/10 px-3 py-2 text-red-100">
                  - {challenge.negativeExample || "<stringa vuota>"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
