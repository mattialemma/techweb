// FILE: PageHeader.tsx
// Purpose: Centralizes the recurring authenticated-page title block.
// Layer: UI primitive
// Exports: PageHeader
import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow: string;
  title: string;
};

export function PageHeader({ actions, className = "", description, eyebrow, title }: PageHeaderProps) {
  return (
    <div
      className={[
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
