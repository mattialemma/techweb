type InlineMessageProps = {
  tone?: "info" | "success" | "error";
  children: string;
};

const tones = {
  info: "border-sky-300/20 bg-sky-300/10 text-sky-100 shadow-sky-950/20",
  success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100 shadow-emerald-950/20",
  error: "border-red-300/20 bg-red-300/10 text-red-100 shadow-red-950/20",
};

export function InlineMessage({ tone = "info", children }: InlineMessageProps) {
  return (
    <p className={`break-words rounded-md border px-3 py-2 text-sm shadow-lg [overflow-wrap:anywhere] ${tones[tone]}`}>
      {children}
    </p>
  );
}
