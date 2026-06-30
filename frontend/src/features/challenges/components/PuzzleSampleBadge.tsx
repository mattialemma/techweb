// FILE: PuzzleSampleBadge.tsx
// Purpose: Renders positive/negative sample strings with consistent visual language.
// Layer: Feature UI component
// Exports: PuzzleSampleBadge

type PuzzleSampleBadgeProps = {
  label: string;
  tone: "negative" | "positive";
  value: string;
};

export function PuzzleSampleBadge({ label, tone, value }: PuzzleSampleBadgeProps) {
  const toneClass =
    tone === "positive"
      ? "border-lime-300/25 bg-lime-300/10 text-lime-50"
      : "border-rose-300/25 bg-rose-300/10 text-rose-50";

  return (
    <div className={`min-h-14 break-all rounded border px-5 py-4 font-mono text-xl ${toneClass}`}>
      <span className="mr-4 align-middle text-sm font-black uppercase tracking-widest opacity-70">{label}</span>
      <span className="align-middle">{value || "<stringa vuota>"}</span>
    </div>
  );
}
