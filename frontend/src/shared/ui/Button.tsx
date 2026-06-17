import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
  secondary: "border border-white/15 bg-white/10 text-white hover:bg-white/15",
  ghost: "text-slate-200 hover:bg-white/10",
  danger: "border border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20",
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
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Caricamento..." : children}
    </button>
  );
}
