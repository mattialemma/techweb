import { useState } from "react";
import { Link } from "react-router-dom";

import { PuzzleTile, usePuzzleCatalog, type PuzzleOrdering } from "@features/challenges";
import { Button, ContentStage, InlineMessage, Panel } from "@shared/ui";

export function ChallengesPage() {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<PuzzleOrdering>("newest");
  const { data, isLoading, isError } = usePuzzleCatalog(page, ordering);
  const challenges = data?.results ?? [];

  function chooseOrdering(nextOrdering: PuzzleOrdering) {
    setOrdering(nextOrdering);
    setPage(1);
  }

  return (
    <ContentStage
        eyebrow="Enigmi"
        title="Enigmi pubblicati"
        description="Consulta gli enigmi disponibili. Le regex segrete e i controlli restano nascosti."
        actions={
          <Link to="/challenges/new">
            <Button className="w-full sm:w-auto">Nuova sfida</Button>
          </Link>
        }
    >

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">Ordina gli enigmi per data di pubblicazione.</p>
          <label className="flex items-center gap-3 text-sm font-semibold text-zinc-200">
            <span>Ordina</span>
            <select
              className="min-h-10 rounded border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
              value={ordering}
              onChange={(event) => chooseOrdering(event.target.value as PuzzleOrdering)}
            >
              <option value="newest">Piu nuove</option>
              <option value="oldest">Piu vecchie</option>
            </select>
          </label>
        </div>

        {isLoading ? <InlineMessage>Caricamento enigmi...</InlineMessage> : null}
        {isError ? (
          <InlineMessage tone="error">Non riesco a caricare gli enigmi in questo momento.</InlineMessage>
        ) : null}
        {!isLoading && !isError && challenges.length === 0 ? (
          <Panel as="div" padding="lg">
            <h2 className="text-xl font-bold">Nessuna sfida ancora</h2>
            <p className="mt-2 text-slate-300">Crea il primo enigma e rendi utile questa pagina.</p>
            <Link to="/challenges/new" className="mt-5 inline-block">
              <Button>Crea sfida</Button>
            </Link>
          </Panel>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <PuzzleTile key={challenge.challengeId} challenge={challenge} />
          ))}
        </div>
        {!isLoading && !isError && data && data.count > challenges.length ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Pagina {page} - {data.count} enigmi totali
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
      </section>
    </ContentStage>
  );
}
