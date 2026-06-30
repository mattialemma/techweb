// FILE: PuzzleBriefPanel.tsx
// Purpose: Displays challenge metadata, description, and public examples.
// Layer: Feature UI component
// Exports: PuzzleBriefPanel
// Depends on: Challenge type, Avatar, Panel, formatter helpers

import { formatDateTime } from "@shared/lib/formatters";
import { Avatar, Panel } from "@shared/ui";

import type { Challenge } from "../types";

import { PuzzleSampleBadge } from "./PuzzleSampleBadge";

type PuzzleBriefPanelProps = {
  challenge: Challenge;
};

export function PuzzleBriefPanel({ challenge }: PuzzleBriefPanelProps) {
  return (
    <Panel padding="lg" className="min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] xl:min-h-[520px]">
      <div className="flex items-center gap-3">
        <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{challenge.author.username}</p>
          <p className="text-base text-zinc-400">{formatDateTime(challenge.createdAt)}</p>
        </div>
      </div>

      <h1 className="mt-12 break-words text-4xl font-black tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
        {challenge.title}
      </h1>
      {challenge.description ? (
        <p className="mt-9 max-w-3xl break-words text-xl leading-8 text-zinc-300 [overflow-wrap:anywhere]">
          {challenge.description}
        </p>
      ) : (
        <p className="mt-9 text-xl text-zinc-500">Nessuna descrizione.</p>
      )}

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        <PuzzleSampleBadge label="passa" tone="positive" value={challenge.positiveExample} />
        <PuzzleSampleBadge label="blocca" tone="negative" value={challenge.negativeExample} />
      </div>
    </Panel>
  );
}
