// FILE: ChallengeExampleToken.tsx
// Purpose: Renders positive/negative sample strings with consistent visual language.
// Layer: Feature UI component
// Exports: ChallengeExampleToken

type ChallengeExampleTokenProps = {
  label: string;
  tone: "negative" | "positive";
  value: string;
};

export function ChallengeExampleToken({ label, tone, value }: ChallengeExampleTokenProps) {
  const toneClass =
    tone === "positive"
      ? "border-lime-300/25 bg-lime-300/10 text-lime-50"
      : "border-rose-300/25 bg-rose-300/10 text-rose-50";

  return (
    <div className={`break-all rounded border px-3 py-2 font-mono text-sm ${toneClass}`}>
      <span className="mr-2 text-xs font-black uppercase tracking-wide opacity-70">{label}</span>
      {value || "<stringa vuota>"}
    </div>
  );
}
