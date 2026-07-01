// File: CreateChallengePage.tsx
// Scopo: Compone e pubblica una nuova sfida regex con controlli nascosti.
// Livello: Pagina privata
// Dipende da: feature challenges, parser errori API, primitive form condivise

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  HiddenControlEditor,
  inspectPuzzleDraft,
  usePublishPuzzle,
  type ChallengeValidationErrors,
  type CreateChallengePayload,
} from "@features/challenges";
import { parseApiFieldErrors } from "@shared/api";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, ContentStage, FormField, InlineMessage, Input, Panel, Textarea } from "@shared/ui";

const emptyChallenge: CreateChallengePayload = {
  title: "",
  description: "",
  secretRegex: "",
  positiveExample: "",
  negativeExample: "",
  positiveControls: [""],
  negativeControls: [""],
};

type ChallengeField = keyof Pick<
  CreateChallengePayload,
  "description" | "negativeExample" | "positiveExample" | "secretRegex" | "title"
>;

type ControlField = "negativeControls" | "positiveControls";

function replaceControlAt(controls: string[], position: number, nextValue: string): string[] {
  return controls.map((control, currentPosition) => (currentPosition === position ? nextValue : control));
}

function dropControlAt(controls: string[], position: number): string[] {
  return controls.length === 1 ? controls : controls.filter((_, currentPosition) => currentPosition !== position);
}

function buildChallengePayload(draft: CreateChallengePayload): CreateChallengePayload {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    positiveControls: draft.positiveControls,
    negativeControls: draft.negativeControls,
  };
}

export function CreateChallengePage() {
  const navigate = useNavigate();
  const createPuzzle = usePublishPuzzle();
  const [challengeDraft, setChallengeDraft] = useState<CreateChallengePayload>(emptyChallenge);
  const [errors, setErrors] = useState<ChallengeValidationErrors>({});
  const [submitError, setSubmitError] = useState("");

  function updateChallengeField(field: ChallengeField, value: string) {
    setChallengeDraft((current) => ({ ...current, [field]: value }));
  }

  function appendControl(field: ControlField) {
    setChallengeDraft((current) => ({ ...current, [field]: [...current[field], ""] }));
  }

  function updateControl(field: ControlField, position: number, value: string) {
    setChallengeDraft((current) => ({
      ...current,
      [field]: replaceControlAt(current[field], position, value),
    }));
  }

  function removeControl(field: ControlField, position: number) {
    setChallengeDraft((current) => ({
      ...current,
      [field]: dropControlAt(current[field], position),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = buildChallengePayload(challengeDraft);
    const nextErrors = inspectPuzzleDraft(payload);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await createPuzzle.mutateAsync(payload);
      navigate("/challenges", { replace: true });
    } catch (error) {
      const parsedErrors = parseApiFieldErrors<ChallengeValidationErrors>(error);
      setErrors(parsedErrors);
      setSubmitError(
        Object.keys(parsedErrors).length
          ? ""
          : "Creazione sfida non riuscita. Controlla i dati inseriti.",
      );
    }
  }

  return (
    <ContentStage
      eyebrow="Nuovo pattern"
      title="Prepara una sfida"
      description="Gli esempi sono pubblici; regex e controlli restano nascosti nel backend."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

        <Panel>
          <div className="space-y-4">
            <FormField label="Titolo" error={errors.title}>
              <Input
                value={challengeDraft.title}
                maxLength={VALIDATION_LIMITS.challengeTitle}
                onChange={(event) => updateChallengeField("title", event.target.value)}
              />
            </FormField>
            <FormField label="Descrizione" error={errors.description}>
              <Textarea
                value={challengeDraft.description}
                maxLength={VALIDATION_LIMITS.challengeDescription}
                onChange={(event) => updateChallengeField("description", event.target.value)}
              />
            </FormField>
            <FormField label="Regex segreta" error={errors.secretRegex}>
              <Input
                value={challengeDraft.secretRegex}
                maxLength={VALIDATION_LIMITS.regex}
                placeholder="^[A-Z]{2}[0-9]{3}$"
                onChange={(event) => updateChallengeField("secretRegex", event.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Esempio positivo" error={errors.positiveExample}>
                <Input
                  value={challengeDraft.positiveExample}
                  maxLength={VALIDATION_LIMITS.example}
                  onChange={(event) => updateChallengeField("positiveExample", event.target.value)}
                />
              </FormField>
              <FormField label="Esempio negativo" error={errors.negativeExample}>
                <Input
                  value={challengeDraft.negativeExample}
                  maxLength={VALIDATION_LIMITS.example}
                  onChange={(event) => updateChallengeField("negativeExample", event.target.value)}
                />
              </FormField>
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <HiddenControlEditor
            error={errors.positiveControls}
            kind="positive"
            values={challengeDraft.positiveControls}
            onAdd={() => appendControl("positiveControls")}
            onChange={(position, value) => updateControl("positiveControls", position, value)}
            onRemove={(position) => removeControl("positiveControls", position)}
          />
          <HiddenControlEditor
            error={errors.negativeControls}
            kind="negative"
            values={challengeDraft.negativeControls}
            onAdd={() => appendControl("negativeControls")}
            onChange={(position, value) => updateControl("negativeControls", position, value)}
            onRemove={(position) => removeControl("negativeControls", position)}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate("/challenges")}>
            Annulla
          </Button>
          <Button type="submit" isLoading={createPuzzle.isPending}>
            Pubblica sfida
          </Button>
        </div>
      </form>
    </ContentStage>
  );
}
