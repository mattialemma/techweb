// File: HowToPlayPage.tsx
// Scopo: Presenta le regole pubbliche del gioco in schede ordinate.
// Livello: Pagina pubblica
// Dipende da: contenuti pubblici e primitive layout condivise

import { ContentStage, Panel } from "@shared/ui";

import { howToPlaySteps } from "./publicContent";

function RuleStepCard({
  index,
  text,
  title,
}: {
  index: number;
  text: string;
  title: string;
}) {
  return (
    <Panel as="article">
      <span className="text-sm font-black text-lime-300">step {index + 1}</span>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-zinc-300">{text}</p>
    </Panel>
  );
}

export function HowToPlayPage() {
  return (
    <ContentStage
      eyebrow="Regole"
      title="Un gioco di indizi, tentativi e pattern nascosti."
    >
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {howToPlaySteps.map((step, index) => (
          <RuleStepCard key={step.title} index={index} text={step.text} title={step.title} />
        ))}
      </div>
    </ContentStage>
  );
}
