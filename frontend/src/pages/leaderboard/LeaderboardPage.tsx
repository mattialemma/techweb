// File: LeaderboardPage.tsx
// Scopo: Mostra classifica risolutori con paginazione.
// Livello: Pagina privata
// Dipende da: SolverBoard, hook classifica, componenti UI condivisi

import { useState } from "react";

import { SolverBoard, useSolverBoard } from "@features/challenges";
import { Button, ContentStage, InlineMessage, Panel } from "@shared/ui";

type LeaderboardPagerProps = {
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pageNumber: number;
  visibleItems: number;
  onNext: () => void;
  onPrevious: () => void;
};

function LeaderboardPager({
  count,
  hasNext,
  hasPrevious,
  pageNumber,
  visibleItems,
  onNext,
  onPrevious,
}: LeaderboardPagerProps) {
  if (count <= visibleItems) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-400">
        Pagina {pageNumber} - {count} solver totali
      </p>
      <div className="flex gap-2">
        <Button disabled={!hasPrevious} variant="secondary" onClick={onPrevious}>
          Precedente
        </Button>
        <Button disabled={!hasNext} variant="secondary" onClick={onNext}>
          Successiva
        </Button>
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const { data, isLoading, isError } = useSolverBoard(pageNumber);
  const solverEntries = data?.results ?? [];

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

      {!isLoading && !isError && solverEntries.length === 0 ? (
        <Panel padding="lg">
          <h2 className="text-xl font-bold">Ancora nessun risolutore</h2>
          <p className="mt-2 text-zinc-300">
            La classifica si popola quando qualcuno risolve almeno una sfida.
          </p>
        </Panel>
      ) : null}

      {solverEntries.length > 0 ? <SolverBoard entries={solverEntries} /> : null}

      {!isLoading && !isError && data ? (
        <LeaderboardPager
          count={data.count}
          hasNext={Boolean(data.next)}
          hasPrevious={Boolean(data.previous)}
          pageNumber={pageNumber}
          visibleItems={solverEntries.length}
          onNext={() => setPageNumber((current) => current + 1)}
          onPrevious={() => setPageNumber((current) => Math.max(1, current - 1))}
        />
      ) : null}
    </ContentStage>
  );
}
