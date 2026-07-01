// File: ChallengeDetailPage.tsx
// Scopo: Mostra dettaglio sfida e gestisce invio tentativi regex.
// Livello: Pagina privata
// Dipende da: feature challenges, autenticazione, parsing errori API

import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@features/auth";
import {
  AttemptLogPanel,
  PuzzleBriefPanel,
  RegexWorkbenchPanel,
  inspectSubmittedPattern,
  usePersonalAttemptLog,
  usePuzzle,
  useSubmitPuzzleAttempt,
  type Attempt,
} from "@features/challenges";
import { parseApiMessage } from "@shared/api";
import { Button, ContentStage, InlineMessage } from "@shared/ui";

function StatusStage({
  action,
  message,
  tone = "info",
}: {
  action?: React.ReactNode;
  message: string;
  tone?: "error" | "info";
}) {
  return (
    <ContentStage>
      <InlineMessage tone={tone}>{message}</InlineMessage>
      {action}
    </ContentStage>
  );
}

export function ChallengeDetailPage() {
  const { challengeId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: challenge, isLoading, isError } = usePuzzle(challengeId);
  const { data: attempts = [], isLoading: attemptsLoading } = usePersonalAttemptLog(challengeId);
  const submitAttempt = useSubmitPuzzleAttempt();
  const [regexDraft, setRegexDraft] = useState("");
  const [regexError, setRegexError] = useState("");
  const [attemptError, setAttemptError] = useState("");
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);

  const isAuthor = Boolean(challenge && user && challenge.author.userId === user.userId);
  const solvedAttempt = useMemo(() => attempts.find((attempt) => attempt.solved), [attempts]);
  const solvedAttemptNumber = solvedAttempt?.attemptNumber ?? latestAttempt?.attemptNumber;
  const hasSolvedChallenge = Boolean(solvedAttempt || latestAttempt?.solved);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttemptError("");
    setLatestAttempt(null);
    const validationError = inspectSubmittedPattern(regexDraft);
    setRegexError(validationError ?? "");
    if (validationError) return;

    try {
      const attempt = await submitAttempt.mutateAsync({
        challengeId,
        proposedRegex: regexDraft,
      });
      setLatestAttempt(attempt);
      setRegexDraft("");
    } catch (error) {
      setAttemptError(parseApiMessage(error, ["detail", "proposedRegex"], "Tentativo non riuscito."));
    }
  }

  if (!challengeId) {
    return <StatusStage tone="error" message="Sfida non valida." />;
  }

  if (isLoading) {
    return <StatusStage message="Caricamento sfida..." />;
  }

  if (isError || !challenge) {
    return (
      <StatusStage
        tone="error"
        message="Sfida non trovata o non disponibile."
        action={
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/challenges")}>
          Torna alle sfide
        </Button>
        }
      />
    );
  }

  return (
    <ContentStage className="max-w-6xl px-5 py-8 sm:px-6">
      <div className="mb-8">
        <Link className="text-sm font-black text-lime-300 hover:text-lime-200" to="/challenges">
          Torna all'archivio
        </Link>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:gap-8">
        <PuzzleBriefPanel challenge={challenge} />

        <aside className="min-w-0 xl:pt-24">
          <RegexWorkbenchPanel
            fieldError={regexError}
            hasSolvedChallenge={hasSolvedChallenge}
            isAuthor={isAuthor}
            isSubmitting={submitAttempt.isPending}
            lastAttempt={latestAttempt}
            onRegexChange={setRegexDraft}
            onSubmit={handleSubmit}
            proposedRegex={regexDraft}
            solvedAttemptNumber={solvedAttemptNumber}
            submitError={attemptError}
          />
        </aside>
      </div>

      <AttemptLogPanel attempts={attempts} isLoading={attemptsLoading} />
    </ContentStage>
  );
}
