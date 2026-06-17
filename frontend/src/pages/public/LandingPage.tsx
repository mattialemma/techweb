import { Link } from "react-router-dom";

import { useAuth } from "@features/auth";
import { Button } from "@shared/ui";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
          REGEXRIDDLE
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
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
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="space-y-3 font-mono text-sm text-slate-200">
          <p className="text-emerald-300">regex segreta</p>
          <pre className="overflow-x-auto rounded-md bg-slate-950/70 p-4">{`^[A-Z]{2}[0-9]{3}$`}</pre>
          <p className="text-slate-400">Esempio positivo: AB123</p>
          <p className="text-slate-400">Esempio negativo: ab123</p>
          <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
            Feedback: 8 positivi, 7 negativi superati
          </div>
        </div>
      </section>
    </main>
  );
}
