import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@features/auth";
import {
  useChallenge,
  useCreateAttempt,
  useMyChallengeAttempts,
  validateProposedRegex,
  type Attempt,
} from "@features/challenges";
import { parseApiMessage } from "@shared/api";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Avatar, Button, FormField, InlineMessage, Input, Panel } from "@shared/ui";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function attemptSummary(attempt: Attempt) {
  return `${attempt.positiveMatched}/${attempt.totalPositive} positivi, ${attempt.negativeMatched}/${attempt.totalNegative} negativi`;
}

export function ChallengeDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const challengeId = Number(params.challengeId);
  const { data: challenge, isLoading, isError } = useChallenge(challengeId);
  const { data: attempts = [], isLoading: attemptsLoading } = useMyChallengeAttempts(challengeId);
  const createAttempt = useCreateAttempt();
  const [proposedRegex, setProposedRegex] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);

  const isAuthor = Boolean(challenge && user && challenge.author.userId === user.userId);
  const solvedAttempt = useMemo(() => attempts.find((attempt) => attempt.solved), [attempts]);
  const solvedAttemptNumber = solvedAttempt?.attemptNumber ?? lastAttempt?.attemptNumber;
  const hasSolvedChallenge = Boolean(solvedAttempt || lastAttempt?.solved);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError("");
    setLastAttempt(null);
    const validationError = validateProposedRegex(proposedRegex);
    setFieldError(validationError ?? "");
    if (validationError) return;

    try {
      const attempt = await createAttempt.mutateAsync({
        challengeId,
        proposedRegex,
      });
      setLastAttempt(attempt);
      setProposedRegex("");
    } catch (error) {
      setSubmitError(parseApiMessage(error, ["detail", "proposedRegex"], "Tentativo non riuscito."));
    }
  }

  if (!Number.isFinite(challengeId) || challengeId <= 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <InlineMessage tone="error">Sfida non valida.</InlineMessage>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <InlineMessage>Caricamento sfida...</InlineMessage>
      </main>
    );
  }

  if (isError || !challenge) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <InlineMessage tone="error">Sfida non trovata o non disponibile.</InlineMessage>
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/challenges")}>
          Torna alle sfide
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-emerald-300 hover:text-emerald-200" to="/challenges">
          Torna alle sfide
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel padding="lg">
          <div className="flex items-center gap-3">
            <Avatar src={challenge.author.avatarUrl} name={challenge.author.username} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{challenge.author.username}</p>
              <p className="text-sm text-slate-400">{formatDate(challenge.createdAt)}</p>
            </div>
          </div>

          <h1 className="mt-6 break-words text-3xl font-black [overflow-wrap:anywhere] sm:text-4xl">
            {challenge.title}
          </h1>
          {challenge.description ? (
            <p className="mt-4 break-words leading-8 text-slate-300 [overflow-wrap:anywhere]">
              {challenge.description}
            </p>
          ) : (
            <p className="mt-4 text-slate-500">Nessuna descrizione.</p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-300/15 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">Esempio positivo</p>
              <p className="mt-2 break-all font-mono text-sm text-emerald-50">
                {challenge.positiveExample || "<stringa vuota>"}
              </p>
            </div>
            <div className="rounded-md border border-red-300/15 bg-red-300/10 p-4">
              <p className="text-sm font-semibold text-red-200">Esempio negativo</p>
              <p className="mt-2 break-all font-mono text-sm text-red-50">
                {challenge.negativeExample || "<stringa vuota>"}
              </p>
            </div>
          </div>
        </Panel>

        <aside className="min-w-0 space-y-5">
          <Panel>
            <h2 className="text-xl font-bold">Prova a risolvere</h2>
            {isAuthor ? (
              <InlineMessage tone="info">
                Sei l'autore della sfida: puoi vederla, ma non puoi inviare tentativi.
              </InlineMessage>
            ) : hasSolvedChallenge ? (
              <InlineMessage tone="success">
                {`Hai gia risolto questa sfida al tentativo ${solvedAttemptNumber}.`}
              </InlineMessage>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
                {lastAttempt ? (
                  <InlineMessage tone="info">
                    {`Feedback: ${attemptSummary(lastAttempt)}.`}
                  </InlineMessage>
                ) : null}
                <FormField label="Regex proposta" error={fieldError}>
                  <Input
                    value={proposedRegex}
                    maxLength={VALIDATION_LIMITS.regex}
                    placeholder="^[A-Z]{2}[0-9]{3}$"
                    onChange={(event) => setProposedRegex(event.target.value)}
                  />
                </FormField>
                <Button type="submit" isLoading={createAttempt.isPending} className="w-full">
                  Invia tentativo
                </Button>
              </form>
            )}
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold">I tuoi tentativi</h2>
            {attemptsLoading ? <p className="mt-3 text-sm text-slate-400">Caricamento...</p> : null}
            {!attemptsLoading && attempts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Nessun tentativo inviato.</p>
            ) : null}
            <div className="mt-4 space-y-3">
              {attempts.map((attempt) => (
                <article
                  key={attempt.attemptId}
                  className="rounded-md border border-white/10 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Tentativo {attempt.attemptNumber}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        attempt.solved
                          ? "bg-emerald-300/15 text-emerald-200"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {attempt.solved ? "Risolta" : "Parziale"}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-sm text-slate-200">
                    {attempt.proposedRegex}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{attemptSummary(attempt)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
