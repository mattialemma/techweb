// FILE: ChallengeSummaryPanel.tsx
// Purpose: Displays challenge metadata, description, and public examples.
// Layer: Feature UI component
// Exports: ChallengeSummaryPanel
// Depends on: Challenge type, Avatar, Panel, formatter helpers

import { formatDateTime } from "@shared/lib/formatters";
import { Avatar, Panel } from "@shared/ui";

import type { Challenge } from "../types";

import { ChallengeExampleToken } from "./ChallengeExampleToken";

type ChallengeSummaryPanelProps = {
  challenge: Challenge;
};

export function ChallengeSummaryPanel({ challenge }: ChallengeSummaryPanelProps) {
  return (
    <Panel padding="lg">
      <div className="flex items-center gap-3">
        <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{challenge.author.username}</p>
          <p className="text-sm text-zinc-400">{formatDateTime(challenge.createdAt)}</p>
        </div>
      </div>

      <h1 className="mt-6 break-words text-3xl font-black tracking-tight [overflow-wrap:anywhere] sm:text-4xl">
        {challenge.title}
      </h1>
      {challenge.description ? (
        <p className="mt-4 break-words leading-8 text-zinc-300 [overflow-wrap:anywhere]">
          {challenge.description}
        </p>
      ) : (
        <p className="mt-4 text-zinc-500">Nessuna descrizione.</p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ChallengeExampleToken label="passa" tone="positive" value={challenge.positiveExample} />
        <ChallengeExampleToken label="blocca" tone="negative" value={challenge.negativeExample} />
      </div>
    </Panel>
  );
}
