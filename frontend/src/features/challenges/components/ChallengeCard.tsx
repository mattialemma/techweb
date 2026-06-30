// FILE: ChallengeCard.tsx
// Purpose: Renders the reusable challenge preview card used in challenge lists.
// Layer: Feature UI component
// Depends on: Challenge type, React Router Link, shared Avatar.
import { Link } from "react-router-dom";

import { formatShortDate } from "@shared/lib/formatters";
import { Avatar } from "@shared/ui";

import type { Challenge } from "../types";

import { ChallengeExampleToken } from "./ChallengeExampleToken";

type ChallengeCardProps = {
  challenge: Challenge;
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <Link
      aria-label={`Apri sfida ${challenge.title}`}
      className="group flex min-h-64 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-zinc-950/45 p-5 shadow-xl shadow-black/20 outline-none backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-lime-300/30 hover:bg-zinc-950/65 hover:shadow-lime-950/20 focus-visible:border-lime-300/50 focus-visible:ring-2 focus-visible:ring-lime-300/30"
      to={`/challenges/${challenge.challengeId}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{challenge.author.username}</p>
            <p className="text-xs text-zinc-400">{formatShortDate(challenge.createdAt)}</p>
          </div>
        </div>
        <h2 className="mt-5 break-words text-xl font-black text-white transition [overflow-wrap:anywhere] group-hover:text-lime-100">
          {challenge.title}
        </h2>
        {challenge.description ? (
          <p className="mt-3 line-clamp-3 break-words leading-7 text-zinc-300 [overflow-wrap:anywhere]">
            {challenge.description}
          </p>
        ) : (
          <p className="mt-3 text-zinc-500">Nessuna descrizione.</p>
        )}
      </div>
      <div className="mt-5 grid gap-2">
        <ChallengeExampleToken label="passa" tone="positive" value={challenge.positiveExample} />
        <ChallengeExampleToken label="stop" tone="negative" value={challenge.negativeExample} />
      </div>
    </Link>
  );
}
