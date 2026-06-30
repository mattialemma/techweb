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

function replaceControlAt(values: string[], index: number, nextValue: string): string[] {
  return values.map((value, currentIndex) => (currentIndex === index ? nextValue : value));
}

function dropControlAt(values: string[], index: number): string[] {
  return values.length === 1 ? values : values.filter((_, currentIndex) => currentIndex !== index);
}

export function CreateChallengePage() {
  const navigate = useNavigate();
  const publishPuzzle = usePublishPuzzle();
  const [values, setValues] = useState<CreateChallengePayload>(emptyChallenge);
  const [errors, setErrors] = useState<ChallengeValidationErrors>({});
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CreateChallengePayload = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      positiveControls: values.positiveControls,
      negativeControls: values.negativeControls,
    };
    const nextErrors = inspectPuzzleDraft(payload);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await publishPuzzle.mutateAsync(payload);
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
                value={values.title}
                maxLength={VALIDATION_LIMITS.challengeTitle}
                onChange={(event) => setValues({ ...values, title: event.target.value })}
              />
            </FormField>
            <FormField label="Descrizione" error={errors.description}>
              <Textarea
                value={values.description}
                maxLength={VALIDATION_LIMITS.challengeDescription}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
              />
            </FormField>
            <FormField label="Regex segreta" error={errors.secretRegex}>
              <Input
                value={values.secretRegex}
                maxLength={VALIDATION_LIMITS.regex}
                placeholder="^[A-Z]{2}[0-9]{3}$"
                onChange={(event) => setValues({ ...values, secretRegex: event.target.value })}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Esempio positivo" error={errors.positiveExample}>
                <Input
                  value={values.positiveExample}
                  maxLength={VALIDATION_LIMITS.example}
                  onChange={(event) => setValues({ ...values, positiveExample: event.target.value })}
                />
              </FormField>
              <FormField label="Esempio negativo" error={errors.negativeExample}>
                <Input
                  value={values.negativeExample}
                  maxLength={VALIDATION_LIMITS.example}
                  onChange={(event) => setValues({ ...values, negativeExample: event.target.value })}
                />
              </FormField>
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <HiddenControlEditor
            error={errors.positiveControls}
            kind="positive"
            values={values.positiveControls}
            onAdd={() =>
              setValues({ ...values, positiveControls: [...values.positiveControls, ""] })
            }
            onChange={(index, value) =>
              setValues({
                ...values,
                positiveControls: replaceControlAt(values.positiveControls, index, value),
              })
            }
            onRemove={(index) =>
              setValues({
                ...values,
                positiveControls: dropControlAt(values.positiveControls, index),
              })
            }
          />
          <HiddenControlEditor
            error={errors.negativeControls}
            kind="negative"
            values={values.negativeControls}
            onAdd={() =>
              setValues({ ...values, negativeControls: [...values.negativeControls, ""] })
            }
            onChange={(index, value) =>
              setValues({
                ...values,
                negativeControls: replaceControlAt(values.negativeControls, index, value),
              })
            }
            onRemove={(index) =>
              setValues({
                ...values,
                negativeControls: dropControlAt(values.negativeControls, index),
              })
            }
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate("/challenges")}>
            Annulla
          </Button>
          <Button type="submit" isLoading={publishPuzzle.isPending}>
            Pubblica sfida
          </Button>
        </div>
      </form>
    </ContentStage>
  );
}
