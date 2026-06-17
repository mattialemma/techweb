import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  useCreateChallenge,
  validateChallengePayload,
  type ChallengeValidationErrors,
  type CreateChallengePayload,
} from "@features/challenges";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { Button, FormField, InlineMessage, Input, Textarea } from "@shared/ui";

const emptyChallenge: CreateChallengePayload = {
  title: "",
  description: "",
  secretRegex: "",
  positiveExample: "",
  negativeExample: "",
  positiveControls: [""],
  negativeControls: [""],
};

function apiErrors(error: unknown): ChallengeValidationErrors {
  if (typeof error !== "object" || error === null || !("response" in error)) return {};
  const response = (error as { response?: { data?: Record<string, string[] | string> } }).response;
  const data = response?.data ?? {};
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  ) as ChallengeValidationErrors;
}

function updateControl(values: string[], index: number, nextValue: string): string[] {
  return values.map((value, currentIndex) => (currentIndex === index ? nextValue : value));
}

function removeControl(values: string[], index: number): string[] {
  return values.length === 1 ? values : values.filter((_, currentIndex) => currentIndex !== index);
}

export function CreateChallengePage() {
  const navigate = useNavigate();
  const createChallenge = useCreateChallenge();
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
    const nextErrors = validateChallengePayload(payload);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await createChallenge.mutateAsync(payload);
      navigate("/challenges", { replace: true });
    } catch (error) {
      const parsedErrors = apiErrors(error);
      setErrors(parsedErrors);
      setSubmitError(
        Object.keys(parsedErrors).length
          ? ""
          : "Creazione sfida non riuscita. Controlla i dati inseriti.",
      );
    }
  }

  function renderControls(kind: "positiveControls" | "negativeControls") {
    const label = kind === "positiveControls" ? "Controlli positivi" : "Controlli negativi";
    const toneClass =
      kind === "positiveControls"
        ? "border-emerald-300/15 bg-emerald-300/5"
        : "border-red-300/15 bg-red-300/5";
    const controls = values[kind];

    return (
      <div className={`rounded-lg border p-4 ${toneClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">{label}</h2>
            <p className="mt-1 text-sm text-slate-400">Da 1 a 10 stringhe segrete.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={controls.length >= VALIDATION_LIMITS.maxControlsPerKind}
            onClick={() => setValues({ ...values, [kind]: [...controls, ""] })}
          >
            Aggiungi
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {controls.map((control, index) => (
            <div key={`${kind}-${index}`} className="flex gap-2">
              <Input
                value={control}
                maxLength={VALIDATION_LIMITS.control}
                placeholder={kind === "positiveControls" ? "AB123" : "ab123"}
                onChange={(event) =>
                  setValues({ ...values, [kind]: updateControl(controls, index, event.target.value) })
                }
              />
              <Button
                type="button"
                variant="ghost"
                disabled={controls.length === 1}
                onClick={() => setValues({ ...values, [kind]: removeControl(controls, index) })}
              >
                X
              </Button>
            </div>
          ))}
        </div>
        {errors[kind] ? <p className="mt-3 text-sm text-red-300">{errors[kind]}</p> : null}
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Nuova sfida
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Crea un regex riddle</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Gli esempi saranno pubblici; regex e controlli resteranno segreti nel backend.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
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
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {renderControls("positiveControls")}
          {renderControls("negativeControls")}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate("/challenges")}>
            Annulla
          </Button>
          <Button type="submit" isLoading={createChallenge.isPending}>
            Pubblica sfida
          </Button>
        </div>
      </form>
    </main>
  );
}
