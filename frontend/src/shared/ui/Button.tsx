// File: Button.tsx
// Scopo: Bottone condiviso con varianti visuali e stato loading.
// Livello: Primitiva UI
// Esporta: Button

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-lime-300 to-teal-200 text-zinc-950 shadow-lg shadow-lime-950/30 hover:from-lime-200 hover:to-teal-100",
  secondary:
    "border border-white/15 bg-white/[0.08] text-white shadow-sm shadow-black/20 hover:border-white/25 hover:bg-white/[0.12]",
  ghost: "text-zinc-200 hover:bg-white/10 hover:text-white",
  danger:
    "border border-rose-400/40 bg-rose-500/10 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/20",
};

const baseButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded px-4 py-2 text-sm font-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300/35 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

function buttonClassName(variant: ButtonVariant, className: string): string {
  return `${baseButtonClass} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const label = isLoading ? "Caricamento..." : children;

  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={isDisabled}
      {...props}
    >
      {label}
    </button>
  );
}
