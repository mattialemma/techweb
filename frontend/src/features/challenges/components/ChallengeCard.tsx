// FILE: ChallengeCard.tsx
// Purpose: Renders the reusable challenge preview card used in challenge lists.
// Layer: Feature UI component
// Depends on: Challenge type, React Router Link, shared Avatar.
import { Link } from "react-router-dom";

import { Avatar } from "@shared/ui";

import type { Challenge } from "../types";

type ChallengeCardProps = {
  challenge: Challenge;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ExampleToken({ label, tone, value }: { label: string; tone: "negative" | "positive"; value: string }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : "border-red-300/20 bg-red-300/10 text-red-100";

  return (
    <div className={`break-all rounded-md border px-3 py-2 font-mono text-sm ${toneClass}`}>
      <span className="mr-2 text-xs font-bold uppercase tracking-wide opacity-70">{label}</span>
      {value || "<stringa vuota>"}
    </div>
  );
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <Link
      aria-label={`Apri sfida ${challenge.title}`}
      className="group flex min-h-64 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-slate-950/45 p-5 shadow-xl shadow-black/20 outline-none backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-slate-950/60 hover:shadow-emerald-950/20 focus-visible:border-emerald-300/50 focus-visible:ring-2 focus-visible:ring-emerald-300/30"
      to={`/challenges/${challenge.challengeId}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{challenge.author.username}</p>
            <p className="text-xs text-slate-400">{formatDate(challenge.createdAt)}</p>
          </div>
        </div>
        <h2 className="mt-5 break-words text-xl font-black text-white transition [overflow-wrap:anywhere] group-hover:text-emerald-100">
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
      <div className="mt-5 grid gap-2">
        <ExampleToken label="ok" tone="positive" value={challenge.positiveExample} />
        <ExampleToken label="no" tone="negative" value={challenge.negativeExample} />
      </div>
    </Link>
  );
}
