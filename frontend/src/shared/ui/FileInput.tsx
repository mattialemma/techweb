import type { InputHTMLAttributes } from "react";

export function FileInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`block w-full cursor-pointer rounded-md border border-white/10 bg-slate-950/60 text-sm text-slate-200 file:mr-4 file:min-h-11 file:border-0 file:bg-emerald-400 file:px-4 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-emerald-300 ${className}`}
      type="file"
      {...props}
    />
  );
}
