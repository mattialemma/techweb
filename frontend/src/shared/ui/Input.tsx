import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-emerald-300 focus:bg-slate-950/85 focus:ring-2 focus:ring-emerald-300/20 ${className}`}
      {...props}
    />
  );
}
