// File: InlineMessage.tsx
// Scopo: Messaggio inline condiviso per info, successo ed errore.
// Livello: Primitiva UI
// Esporta: InlineMessage

type InlineMessageProps = {
  tone?: "info" | "success" | "error";
  children: string;
};

const tones = {
  info: "border-teal-300/20 bg-teal-300/10 text-teal-100 shadow-teal-950/20",
  success: "border-lime-300/20 bg-lime-300/10 text-lime-100 shadow-lime-950/20",
  error: "border-rose-300/20 bg-rose-300/10 text-rose-100 shadow-rose-950/20",
};

const baseMessageClass = "break-words rounded border px-3 py-2 text-sm shadow-lg [overflow-wrap:anywhere]";

export function InlineMessage({ tone = "info", children }: InlineMessageProps) {
  return (
    <p className={`${baseMessageClass} ${tones[tone]}`}>
      {children}
    </p>
  );
}
