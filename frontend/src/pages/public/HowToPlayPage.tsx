import { Panel } from "@shared/ui";

const steps = [
  {
    title: "Crea una regex segreta",
    text: "L'autore inserisce una regex valida, un esempio positivo e uno negativo.",
  },
  {
    title: "Aggiungi controlli nascosti",
    text: "Le stringhe di controllo positive e negative restano segrete e servono a validare i tentativi.",
  },
  {
    title: "Prova a risolvere",
    text: "Gli altri utenti propongono una regex e ricevono il numero di controlli superati.",
  },
  {
    title: "Scala la classifica",
    text: "Contano gli enigmi risolti e il minor numero medio di tentativi.",
  },
];

export function HowToPlayPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Come si gioca
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-5xl">
        Una sfida tra logica, pattern e deduzione.
      </h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <Panel key={step.title} as="article">
            <span className="text-sm font-bold text-emerald-300">0{index + 1}</span>
            <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
            <p className="mt-3 leading-7 text-slate-300">{step.text}</p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
