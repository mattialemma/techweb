// FILE: AppPage.tsx
// Purpose: Standardizes page width, top spacing, and optional page headers.
// Layer: UI layout primitive
// Exports: AppPage
// Depends on: PageHeader

import type { ReactNode } from "react";

import { PageHeader } from "./PageHeader";

type AppPageProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  title?: string;
};

export function AppPage({
  actions,
  children,
  className = "",
  description,
  eyebrow,
  title,
}: AppPageProps) {
  return (
    <main className={`mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 ${className}`}>
      {eyebrow && title ? (
        <PageHeader
          actions={actions}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
      ) : null}
      {children}
    </main>
  );
}
