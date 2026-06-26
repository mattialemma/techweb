import { Link } from "react-router-dom";

import { ChallengeCard, useChallenges } from "@features/challenges";
import { Button, InlineMessage, PageHeader, Panel } from "@shared/ui";

export function ChallengesPage() {
  const { data: challenges = [], isLoading, isError } = useChallenges();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Sfide"
        title="Regex riddle pubblicati"
        description="Consulta gli enigmi disponibili. Le regex segrete e i controlli restano nascosti."
        actions={
          <Link to="/challenges/new">
            <Button className="w-full sm:w-auto">Nuova sfida</Button>
          </Link>
        }
      />

      <section>
        {isLoading ? <InlineMessage>Caricamento sfide...</InlineMessage> : null}
        {isError ? (
          <InlineMessage tone="error">Non riesco a caricare le sfide in questo momento.</InlineMessage>
        ) : null}
        {!isLoading && !isError && challenges.length === 0 ? (
          <Panel as="div" padding="lg">
            <h2 className="text-xl font-bold">Nessuna sfida ancora</h2>
            <p className="mt-2 text-slate-300">Crea il primo enigma e rendi utile questa pagina.</p>
            <Link to="/challenges/new" className="mt-5 inline-block">
              <Button>Crea sfida</Button>
            </Link>
          </Panel>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.challengeId} challenge={challenge} />
          ))}
        </div>
      </section>
    </main>
  );
}
