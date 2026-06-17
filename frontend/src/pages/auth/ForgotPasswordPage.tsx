// FILE: ForgotPasswordPage.tsx
// Purpose: Starts the OTP password reset flow by requesting an email code.
// Layer: Page
// Depends on: auth API, auth validation, shared auth form components.

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { requestPasswordOtp } from "@features/auth/api";
import { validateEmail, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input } from "@shared/ui";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);
    setErrors(emailError ? { email: emailError } : {});
    setSubmitError("");
    if (emailError) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await requestPasswordOtp(normalizedEmail);
      navigate(`/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setSubmitError("Non riesco a inviare il codice in questo momento.");
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
        {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
