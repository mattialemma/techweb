// File: LandingPatternScene.tsx
// Scopo: Costruisce lo sfondo visuale a piena area usato solo nella home pubblica.
// Livello: Componente visuale di pagina
// Esporta: LandingPatternScene

const patternLines = [
  "/^[A-Z]{2}[0-9]{3}$/",
  "/^(cat|dog)-[0-9]+$/",
  "/^[a-z]+@[a-z]+\\.it$/",
  "/^#[A-F0-9]{6}$/",
];

const sampleNodes = [
  { label: "AB123", result: "match", className: "left-[8%] top-[18%]" },
  { label: "ab123", result: "reject", className: "right-[12%] top-[22%]" },
  { label: "LAB-42", result: "match", className: "right-[18%] bottom-[28%]" },
  { label: "#GG5500", result: "reject", className: "left-[16%] bottom-[20%]" },
];

function PatternTicker() {
  return (
    <div className="absolute -left-16 top-14 flex w-[120%] -rotate-6 flex-col gap-5 font-mono text-sm text-lime-200/45 sm:text-base">
      {patternLines.map((line) => (
        <div
          key={line}
          className="whitespace-nowrap border-y border-lime-300/10 bg-black/20 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
          <span className="mx-10">{line}</span>
          <span className="mx-10 text-teal-200/55">test suite running</span>
          <span className="mx-10">{line}</span>
        </div>
      ))}
    </div>
  );
}

function RadarRings() {
  return (
    <div className="absolute right-[-6rem] top-1/2 hidden h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-lime-300/15 md:block">
      <div className="absolute inset-12 rounded-full border border-teal-200/15" />
      <div className="absolute inset-24 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300 shadow-[0_0_42px_rgba(190,242,100,0.95)]" />
      <div className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left animate-spin bg-gradient-to-r from-lime-300/70 to-transparent [animation-duration:12s]" />
    </div>
  );
}

export function LandingPatternScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(190,242,100,0.22),transparent_22rem),radial-gradient(circle_at_18%_72%,rgba(20,184,166,0.16),transparent_26rem),linear-gradient(140deg,#090908_0%,#141410_48%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:72px_72px]" />

      <PatternTicker />
      <RadarRings />

      {sampleNodes.map((node) => (
        <div
          key={node.label}
          className={`absolute hidden rounded-full border border-white/10 bg-zinc-950/55 px-4 py-2 font-mono text-xs shadow-xl shadow-black/30 backdrop-blur transition duration-300 hover:border-lime-300/40 hover:text-lime-100 md:block ${node.className}`}
        >
          <span className="text-white">{node.label}</span>
          <span className="ml-3 text-zinc-400">{node.result}</span>
        </div>
      ))}
    </div>
  );
}
