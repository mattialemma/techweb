// File: PageHeader.tsx
// Scopo: Centralizza il blocco titolo ricorrente delle pagine autenticate.
// Livello: Primitiva UI
// Esporta: PageHeader

import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow: string;
  title: string;
};

function joinClassNames(parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

function PageTitleBlock({ description, eyebrow, title }: Pick<PageHeaderProps, "description" | "eyebrow" | "title">) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl leading-7 text-zinc-300">{description}</p> : null}
    </div>
  );
}

export function PageHeader({ actions, className = "", description, eyebrow, title }: PageHeaderProps) {
  const wrapperClass = joinClassNames([
    "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
    className,
  ]);

  return (
    <div className={wrapperClass}>
      <PageTitleBlock description={description} eyebrow={eyebrow} title={title} />
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
