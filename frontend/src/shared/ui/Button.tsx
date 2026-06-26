import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-emerald-300 to-cyan-200 text-slate-950 shadow-lg shadow-emerald-950/30 hover:from-emerald-200 hover:to-cyan-100",
  secondary:
    "border border-white/15 bg-white/[0.07] text-white shadow-sm shadow-black/20 hover:border-white/25 hover:bg-white/[0.11]",
  ghost: "text-slate-200 hover:bg-white/10 hover:text-white",
  danger:
    "border border-red-400/40 bg-red-500/10 text-red-100 hover:border-red-300/50 hover:bg-red-500/20",
};

export function Button({
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/35 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Caricamento..." : children}
    </button>
  );
}
