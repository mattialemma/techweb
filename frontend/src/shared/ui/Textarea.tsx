// File: Textarea.tsx
// Scopo: Textarea base con stile coerente per i form lunghi.
// Livello: Primitiva UI
// Esporta: Textarea

import type { TextareaHTMLAttributes } from "react";

const textareaBaseClass =
  "min-h-28 w-full resize-y rounded border border-white/10 bg-zinc-950/72 px-3 py-2 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-lime-300 focus:bg-zinc-950/90 focus:ring-2 focus:ring-lime-300/20";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${textareaBaseClass} ${className}`}
      {...props}
    />
  );
}
