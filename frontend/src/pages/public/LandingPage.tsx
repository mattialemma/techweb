// File: LandingPage.tsx
// Scopo: Renderizza la home pubblica con azioni sensibili all'autenticazione.
// Livello: Pagina pubblica
// Dipende da: contesto autenticazione, link router, pulsanti condivisi, scena visuale home

import { Link } from "react-router-dom";

import { useAuth } from "@features/auth";
import { Button } from "@shared/ui";

import { LandingPatternScene } from "./LandingPatternScene";

function LandingActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <Link to={isAuthenticated ? "/challenges" : "/register"}>
        <Button className="w-full sm:w-auto">
          {isAuthenticated ? "Apri gli enigmi" : "Inizia una partita"}
        </Button>
      </Link>
      <Link to="/how-to-play">
        <Button variant="secondary" className="w-full sm:w-auto">
          Leggi le regole
        </Button>
      </Link>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="relative min-h-[calc(100svh-77px)] overflow-hidden text-white">
      <section className="relative flex min-h-[calc(100svh-77px)] items-center">
        <LandingPatternScene />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/76 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl">
            <p className="font-mono text-sm font-black uppercase tracking-[0.36em] text-lime-300">
              regex challenge system
            </p>
            <h1 className="mt-5 text-6xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">
              PATTERNLAB
            </h1>
            <p className="mt-6 max-w-xl text-2xl font-black leading-tight text-zinc-100 sm:text-3xl">
              Trova la regola nascosta prima degli altri.
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
              Crea enigmi con regex segrete, osserva pochi indizi e risolvi pattern testuali
              usando solo feedback numerici.
            </p>

            <LandingActions isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </section>
    </main>
  );
}
