// FILE: Panel.tsx
// Purpose: Provides the shared translucent panel shell used by app pages.
// Layer: UI primitive
// Exports: Panel
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

export function Panel({
  as: Component = "section",
  children,
  className = "",
  padding = "md",
  ...props
}: PanelProps) {
  const classes = [
    "min-w-0 rounded-lg border border-white/10 bg-slate-950/45 shadow-2xl shadow-black/20 backdrop-blur",
    paddingClass[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
