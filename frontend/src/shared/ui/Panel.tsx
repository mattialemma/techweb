// File: Panel.tsx
// Scopo: Fornisce il pannello traslucido condiviso usato dalle pagine app.
// Livello: Primitiva UI
// Esporta: Panel

import type { HTMLAttributes, ReactNode } from "react";

type PanelElement = "aside" | "article" | "div" | "section";
type PanelPadding = "none" | "sm" | "md" | "lg";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
  children: ReactNode;
  padding?: PanelPadding;
};

const paddingClass: Record<PanelPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-5 sm:p-6",
};

const panelShellClass =
  "min-w-0 rounded-lg border border-white/10 bg-zinc-950/48 shadow-2xl shadow-black/25 backdrop-blur";

function composePanelClass(padding: PanelPadding, className: string): string {
  return [panelShellClass, paddingClass[padding], className].filter(Boolean).join(" ");
}

export function Panel({
  as: Component = "section",
  children,
  className = "",
  padding = "md",
  ...props
}: PanelProps) {
  const classes = composePanelClass(padding, className);

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
