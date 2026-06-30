import { ContentStage, Panel } from "@shared/ui";

import { howToPlaySteps } from "./publicContent";

export function HowToPlayPage() {
  return (
    <ContentStage
      eyebrow="Regole"
      title="Un gioco di indizi, tentativi e pattern nascosti."
    >
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {howToPlaySteps.map((step, index) => (
          <Panel key={step.title} as="article">
            <span className="text-sm font-black text-lime-300">step {index + 1}</span>
            <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
            <p className="mt-3 leading-7 text-zinc-300">{step.text}</p>
          </Panel>
        ))}
      </div>
    </ContentStage>
  );
}
