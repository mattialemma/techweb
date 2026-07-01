// File: PuzzleTile.tsx
// Scopo: Renderizza la scheda anteprima sfida riutilizzabile nelle liste.
// Livello: Componente UI funzionalita
// Dipende da: tipo Challenge, Link di React Router, Avatar condiviso.
import { Link } from "react-router-dom";

import { formatShortDate } from "@shared/lib/formatters";
import { Avatar } from "@shared/ui";

import type { Challenge } from "../types";

import { PuzzleSampleBadge } from "./PuzzleSampleBadge";

type PuzzleTileProps = {
  challenge: Challenge;
};

function PuzzleTileAuthor({ puzzle }: { puzzle: Challenge }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={puzzle.author.avatarUrl} name={puzzle.author.username} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{puzzle.author.username}</p>
        <p className="text-xs text-zinc-400">{formatShortDate(puzzle.createdAt)}</p>
      </div>
    </div>
  );
}

export function PuzzleTile({ challenge: puzzle }: PuzzleTileProps) {
  const descriptionPreview = puzzle.description ? (
    <p className="mt-3 line-clamp-3 break-words leading-7 text-zinc-300 [overflow-wrap:anywhere]">
      {puzzle.description}
    </p>
  ) : (
    <p className="mt-3 text-zinc-500">Nessuna descrizione.</p>
  );

  return (
    <Link
      aria-label={`Apri sfida ${puzzle.title}`}
      className="group flex min-h-64 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-zinc-950/45 p-5 shadow-xl shadow-black/20 outline-none backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-lime-300/30 hover:bg-zinc-950/65 hover:shadow-lime-950/20 focus-visible:border-lime-300/50 focus-visible:ring-2 focus-visible:ring-lime-300/30"
      to={`/challenges/${puzzle.challengeId}`}
    >
      <div className="min-w-0">
        <PuzzleTileAuthor puzzle={puzzle} />
        <h2 className="mt-5 break-words text-xl font-black text-white transition [overflow-wrap:anywhere] group-hover:text-lime-100">
          {puzzle.title}
        </h2>
        {descriptionPreview}
      </div>
      <div className="mt-5 grid gap-2">
        <PuzzleSampleBadge label="passa" tone="positive" value={puzzle.positiveExample} />
        <PuzzleSampleBadge label="stop" tone="negative" value={puzzle.negativeExample} />
      </div>
    </Link>
  );
}
