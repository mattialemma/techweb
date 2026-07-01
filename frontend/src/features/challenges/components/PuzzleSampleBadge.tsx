// File: PuzzleSampleBadge.tsx
// Scopo: Renderizza esempi positivi/negativi con linguaggio visuale coerente.
// Livello: Componente UI funzionalita
// Esporta: PuzzleSampleBadge

type PuzzleSampleBadgeProps = {
  label: string;
  tone: "negative" | "positive";
  value: string;
};

const sampleToneClass: Record<PuzzleSampleBadgeProps["tone"], string> = {
  negative: "border-rose-300/25 bg-rose-300/10 text-rose-50",
  positive: "border-lime-300/25 bg-lime-300/10 text-lime-50",
};

export function PuzzleSampleBadge({ label, tone, value: sampleValue }: PuzzleSampleBadgeProps) {
  const visibleValue = sampleValue || "<stringa vuota>";

  return (
    <div className={`min-h-14 break-all rounded border px-5 py-4 font-mono text-xl ${sampleToneClass[tone]}`}>
      <span className="mr-4 align-middle text-sm font-black uppercase tracking-widest opacity-70">{label}</span>
      <span className="align-middle">{visibleValue}</span>
    </div>
  );
}
