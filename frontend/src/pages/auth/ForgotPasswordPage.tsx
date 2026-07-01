// File: ForgotPasswordPage.tsx
// Scopo: Avvia il flusso OTP di reset password richiedendo un codice email.
// Livello: Pagina
// Dipende da: API autenticazione, validazione autenticazione, componenti modulo condivisi.

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { requestPasswordOtp } from "@features/auth/api";
import { validateEmail, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input } from "@shared/ui";

function normalizeRecoveryEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [emailDraft, setEmailDraft] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(emailDraft);
    setErrors(emailError ? { email: emailError } : {});
    setRequestError("");
    if (emailError) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = normalizeRecoveryEmail(emailDraft);
      await requestPasswordOtp(normalizedEmail);
      navigate(`/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setRequestError("Non riesco a inviare il codice in questo momento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Recupera password"
      subtitle="Inserisci l'email del tuo account: ti invieremo un codice di verifica."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {requestError ? <InlineMessage tone="error">{requestError}</InlineMessage> : null}
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={emailDraft}
            onChange={(event) => setEmailDraft(event.target.value)}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Invia codice
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-300">
        Ricordi la password?{" "}
        <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/login">
          Torna al login
        </Link>
      </p>
    </AuthCard>
  );
}
