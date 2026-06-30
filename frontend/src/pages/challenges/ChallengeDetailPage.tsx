import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@features/auth";
import {
  AttemptHistory,
  AttemptSolverPanel,
  ChallengeSummaryPanel,
  useChallenge,
  useCreateAttempt,
  useMyChallengeAttempts,
  validateProposedRegex,
  type Attempt,
} from "@features/challenges";
import { parseApiMessage } from "@shared/api";
import { AppPage, Button, InlineMessage } from "@shared/ui";

export function ChallengeDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const challengeId = params.challengeId ?? "";
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

  if (!challengeId) {
    return (
      <AppPage>
        <InlineMessage tone="error">Sfida non valida.</InlineMessage>
      </AppPage>
    );
  }

  if (isLoading) {
    return (
      <AppPage>
        <InlineMessage>Caricamento sfida...</InlineMessage>
      </AppPage>
    );
  }

  if (isError || !challenge) {
    return (
      <AppPage>
        <InlineMessage tone="error">Sfida non trovata o non disponibile.</InlineMessage>
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/challenges")}>
          Torna alle sfide
        </Button>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className="mb-6">
        <Link className="text-sm font-black text-lime-300 hover:text-lime-200" to="/challenges">
          Torna all'archivio
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ChallengeSummaryPanel challenge={challenge} />

        <aside className="min-w-0 space-y-5">
          <AttemptSolverPanel
            fieldError={fieldError}
            hasSolvedChallenge={hasSolvedChallenge}
            isAuthor={isAuthor}
            isSubmitting={createAttempt.isPending}
            lastAttempt={lastAttempt}
            onRegexChange={setProposedRegex}
            onSubmit={handleSubmit}
            proposedRegex={proposedRegex}
            solvedAttemptNumber={solvedAttemptNumber}
            submitError={submitError}
          />

          <AttemptHistory attempts={attempts} isLoading={attemptsLoading} />
        </aside>
      </div>
    </AppPage>
  );
}
