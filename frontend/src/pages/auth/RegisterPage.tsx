// File: RegisterPage.tsx
// Scopo: Registra un nuovo utente e lo porta al catalogo sfide.
// Livello: Pagina auth
// Dipende da: contesto autenticazione, validazione registrazione, UI form condivisa

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth, validateRegister, type RegisterPayload, type ValidationErrors } from "@features/auth";
import { parseApiFieldErrors } from "@shared/api";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input, PasswordInput } from "@shared/ui";

type RegisterField = keyof RegisterPayload;

const blankRegistration: RegisterPayload = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

function normalizeRegistrationDraft(draft: RegisterPayload): RegisterPayload {
  return {
    ...draft,
    username: draft.username.trim(),
    email: draft.email.trim(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
  };
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [registrationDraft, setRegistrationDraft] = useState<RegisterPayload>(blankRegistration);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateRegistrationField(field: RegisterField, value: string) {
    setRegistrationDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const remainingErrors = { ...current };
      delete remainingErrors[field];
      return remainingErrors;
    });
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateRegister(registrationDraft);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register(normalizeRegistrationDraft(registrationDraft));
      navigate("/challenges", { replace: true });
    } catch (error) {
      const apiErrors = parseApiFieldErrors<ValidationErrors>(error);
      setErrors(apiErrors);
      setSubmitError(Object.keys(apiErrors).length ? "" : "Registrazione non riuscita.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Crea account" subtitle="Registrati e prepara il terreno per le tue sfide regex.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
        <FormField label="Username" error={errors.username}>
          <Input
            autoComplete="username"
            maxLength={VALIDATION_LIMITS.username}
            value={registrationDraft.username}
            onChange={(event) => updateRegistrationField("username", event.target.value)}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={registrationDraft.email}
            onChange={(event) => updateRegistrationField("email", event.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={errors.firstName}>
            <Input
              autoComplete="given-name"
              maxLength={VALIDATION_LIMITS.name}
              value={registrationDraft.firstName}
              onChange={(event) => updateRegistrationField("firstName", event.target.value)}
            />
          </FormField>
          <FormField label="Cognome" error={errors.lastName}>
            <Input
              autoComplete="family-name"
              maxLength={VALIDATION_LIMITS.name}
              value={registrationDraft.lastName}
              onChange={(event) => updateRegistrationField("lastName", event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Password" error={errors.password}>
          <PasswordInput
            autoComplete="new-password"
            maxLength={VALIDATION_LIMITS.password}
            value={registrationDraft.password}
            onChange={(event) => updateRegistrationField("password", event.target.value)}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Registrati
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-300">
        Hai gia un account?{" "}
        <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
