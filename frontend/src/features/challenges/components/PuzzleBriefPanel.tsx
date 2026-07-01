// File: PuzzleBriefPanel.tsx
// Scopo: Mostra metadati, descrizione ed esempi pubblici della sfida.
// Livello: Componente UI funzionalita
// Esporta: PuzzleBriefPanel
// Dipende da: tipo Challenge, Avatar, Panel, funzioni formattazione

import { formatDateTime } from "@shared/lib/formatters";
import { Avatar, Panel } from "@shared/ui";

import type { Challenge } from "../types";

import { PuzzleSampleBadge } from "./PuzzleSampleBadge";

type PuzzleBriefPanelProps = {
  challenge: Challenge;
};

function ChallengeAuthorStamp({ challenge }: { challenge: Challenge }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-lg font-black">{challenge.author.username}</p>
        <p className="text-base text-zinc-400">{formatDateTime(challenge.createdAt)}</p>
      </div>
    </div>
  );
}

export function PuzzleBriefPanel({ challenge: puzzle }: PuzzleBriefPanelProps) {
  const descriptionBlock = puzzle.description ? (
    <p className="mt-9 max-w-3xl break-words text-xl leading-8 text-zinc-300 [overflow-wrap:anywhere]">
      {puzzle.description}
    </p>
  ) : (
    <p className="mt-9 text-xl text-zinc-500">Nessuna descrizione.</p>
  );

  return (
    <Panel padding="lg" className="min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] xl:min-h-[520px]">
      <ChallengeAuthorStamp challenge={puzzle} />

      <h1 className="mt-12 break-words text-4xl font-black tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
        {puzzle.title}
      </h1>
      {descriptionBlock}

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        <PuzzleSampleBadge label="passa" tone="positive" value={puzzle.positiveExample} />
        <PuzzleSampleBadge label="blocca" tone="negative" value={puzzle.negativeExample} />
      </div>
    </Panel>
  );
}
