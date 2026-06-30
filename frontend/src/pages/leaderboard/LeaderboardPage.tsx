import { useState } from "react";

import { SolverBoard, useSolverBoard } from "@features/challenges";
import { Button, ContentStage, InlineMessage, Panel } from "@shared/ui";

export function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSolverBoard(page);
  const entries = data?.results ?? [];

  return (
    <ContentStage
        eyebrow="Podio"
        title="Migliori risolutori"
        description="Conta quante sfide risolvi e quanti tentativi ti servono in media."
    >

      {isLoading ? <InlineMessage>Caricamento classifica...</InlineMessage> : null}
      {isError ? (
        <InlineMessage tone="error">Non riesco a caricare la classifica in questo momento.</InlineMessage>
      ) : null}

      {!isLoading && !isError && entries.length === 0 ? (
        <Panel padding="lg">
          <h2 className="text-xl font-bold">Ancora nessun risolutore</h2>
          <p className="mt-2 text-zinc-300">
            La classifica si popola quando qualcuno risolve almeno una sfida.
          </p>
        </Panel>
      ) : null}

      {entries.length > 0 ? <SolverBoard entries={entries} /> : null}

      {!isLoading && !isError && data && data.count > entries.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
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
    </ContentStage>
  );
}
