import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded border border-white/10 bg-zinc-950/72 px-3 py-2 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-lime-300 focus:bg-zinc-950/90 focus:ring-2 focus:ring-lime-300/20 ${className}`}
      {...props}
    />
  );
}
