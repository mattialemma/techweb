// File: ContentStage.tsx
// Scopo: Standardizza larghezza pagina, spaziatura alta e header opzionali.
// Livello: Primitiva layout UI
// Esporta: ContentStage
// Dipende da: PageHeader

import type { ReactNode } from "react";

import { PageHeader } from "./PageHeader";

type ContentStageProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  title?: string;
};

function maybeRenderHeader({
  actions,
  description,
  eyebrow,
  title,
}: Pick<ContentStageProps, "actions" | "description" | "eyebrow" | "title">) {
  return eyebrow && title ? (
    <PageHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />
  ) : null;
}

export function ContentStage({
  actions,
  children,
  className = "",
  description,
  eyebrow,
  title,
}: ContentStageProps) {
  return (
    <main className={`mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 ${className}`}>
      {maybeRenderHeader({ actions, description, eyebrow, title })}
      {children}
    </main>
  );
}
