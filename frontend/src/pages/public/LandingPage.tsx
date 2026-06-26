import { Link } from "react-router-dom";

import { useAuth } from "@features/auth";
import { Button, Panel } from "@shared/ui";

const checks = ["match: AB123", "reject: ab123", "score: 8/10"];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
      <section className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
          Pattern game online
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
          REGEXRIDDLE
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          Risolvi enigmi testuali scrivendo la regex giusta.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Crea sfide con una regex segreta, metti alla prova gli altri utenti e scala la
          classifica risolvendo più enigmi con meno tentativi.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={isAuthenticated ? "/challenges" : "/register"}>
            <Button className="w-full sm:w-auto">
              {isAuthenticated ? "Vai alle sfide" : "Inizia ora"}
            </Button>
          </Link>
          <Link to="/how-to-play">
            <Button variant="secondary" className="w-full sm:w-auto">
              Come funziona
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid max-w-xl gap-3 text-sm text-slate-300 sm:grid-cols-3">
          {checks.map((check) => (
            <div key={check} className="rounded-md border border-white/10 bg-slate-950/45 px-3 py-2 font-mono">
              {check}
            </div>
          ))}
        </div>
      </section>

      <Panel className="relative overflow-hidden" padding="lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-cyan-200 to-amber-200" />
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-sm text-emerald-300">secret.regex</p>
            <p className="mt-1 text-sm text-slate-400">Round demo</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-200/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          </div>
        </div>
        <div className="mt-5 space-y-4 font-mono text-sm">
          <pre className="overflow-x-auto rounded-md border border-white/10 bg-black/35 p-4 text-emerald-100">{`/^[A-Z]{2}[0-9]{3}$/`}</pre>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">match</p>
              <p className="mt-2 text-emerald-50">AB123</p>
            </div>
            <div className="rounded-md border border-red-300/20 bg-red-300/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-red-200">reject</p>
              <p className="mt-2 text-red-50">ab123</p>
            </div>
          </div>
          <div className="rounded-md border border-cyan-200/20 bg-cyan-200/10 p-4 text-cyan-50">
            Feedback: 8 positivi, 7 negativi superati
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">confidence 78%</p>
        </div>
      </Panel>
    </main>
  );
}
