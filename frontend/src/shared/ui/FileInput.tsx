import type { InputHTMLAttributes } from "react";

export function FileInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`block w-full cursor-pointer rounded-md border border-white/10 bg-slate-950/70 text-sm text-slate-200 shadow-inner shadow-black/20 transition hover:border-white/20 file:mr-4 file:min-h-11 file:border-0 file:bg-emerald-300 file:px-4 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-cyan-200 ${className}`}
      type="file"
      {...props}
    />
  );
}
