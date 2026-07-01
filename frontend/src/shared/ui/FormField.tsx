// File: FormField.tsx
// Scopo: Associa label, controllo e messaggio errore nei form.
// Livello: Primitiva UI
// Esporta: FormField

import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-2 block text-sm text-rose-300">{message}</span> : null;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-200">{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}
