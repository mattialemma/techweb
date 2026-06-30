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

export function ChallengeDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const challengeId = params.challengeId ?? "";
  const { data: challenge, isLoading, isError } = usePuzzle(challengeId);
  const { data: attempts = [], isLoading: attemptsLoading } = usePersonalAttemptLog(challengeId);
  const submitAttempt = useSubmitPuzzleAttempt();
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
    const validationError = inspectSubmittedPattern(proposedRegex);
    setFieldError(validationError ?? "");
    if (validationError) return;

    try {
      const attempt = await submitAttempt.mutateAsync({
        challengeId,
        proposedRegex,
      });
      setLastAttempt(attempt);
      setProposedRegex("");
    } catch (error) {
      setSubmitError(parseApiMessage(error, ["detail", "proposedRegex"], "Tentativo non riuscito."));
    }
  }

  if (!challengeId) {
    return (
      <ContentStage>
        <InlineMessage tone="error">Sfida non valida.</InlineMessage>
      </ContentStage>
    );
  }

  if (isLoading) {
    return (
      <ContentStage>
        <InlineMessage>Caricamento sfida...</InlineMessage>
      </ContentStage>
    );
  }

  if (isError || !challenge) {
    return (
      <ContentStage>
        <InlineMessage tone="error">Sfida non trovata o non disponibile.</InlineMessage>
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/challenges")}>
          Torna alle sfide
        </Button>
      </ContentStage>
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
            fieldError={fieldError}
            hasSolvedChallenge={hasSolvedChallenge}
            isAuthor={isAuthor}
            isSubmitting={submitAttempt.isPending}
            lastAttempt={lastAttempt}
            onRegexChange={setProposedRegex}
            onSubmit={handleSubmit}
            proposedRegex={proposedRegex}
            solvedAttemptNumber={solvedAttemptNumber}
            submitError={submitError}
          />
        </aside>
      </div>

      <AttemptLogPanel attempts={attempts} isLoading={attemptsLoading} />
    </ContentStage>
  );
}
