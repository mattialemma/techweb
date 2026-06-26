import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          REGEXRIDDLE
        </p>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
