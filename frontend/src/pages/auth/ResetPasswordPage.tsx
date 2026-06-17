// FILE: ResetPasswordPage.tsx
// Purpose: Completes password recovery with OTP verification and a new password.
// Layer: Page
// Depends on: auth password reset API, URL query email, shared auth UI.

import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { resetPasswordWithOtp, verifyPasswordOtp } from "@features/auth/api";
import { validatePasswordReset, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input } from "@shared/ui";

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Password non aggiornata. Controlla codice e nuova password.";
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = useMemo(() => {
    const search = new URLSearchParams(location.search);
    return search.get("email")?.trim().toLowerCase() ?? "";
  }, [location.search]);
  const [values, setValues] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePasswordReset({ email, ...values });
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const verification = await verifyPasswordOtp(email, values.code);
      if (!verification.valid) {
        setErrors({ code: "Codice non valido o scaduto." });
        return;
      }
      await resetPasswordWithOtp(email, values.code, values.newPassword);
      setMessage("Password aggiornata. Torno al login...");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Imposta nuova password"
      subtitle="Inserisci il codice ricevuto via email e scegli una nuova password."
    >
      {!email ? (
        <InlineMessage tone="error">
          Email mancante. Riparti dalla richiesta di recupero password.
        </InlineMessage>
      ) : null}
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {message ? (
          <InlineMessage tone={message.includes("aggiornata") ? "success" : "error"}>
            {message}
          </InlineMessage>
        ) : null}
        <FormField label="Codice OTP" error={errors.code}>
          <Input
            inputMode="numeric"
            maxLength={6}
            value={values.code}
            onChange={(event) => setValues({ ...values, code: event.target.value })}
          />
        </FormField>
        <FormField label="Nuova password" error={errors.newPassword}>
          <Input
            autoComplete="new-password"
            type="password"
            maxLength={VALIDATION_LIMITS.password}
            value={values.newPassword}
            onChange={(event) => setValues({ ...values, newPassword: event.target.value })}
          />
        </FormField>
        <FormField label="Conferma nuova password" error={errors.confirmPassword}>
          <Input
            autoComplete="new-password"
            type="password"
            maxLength={VALIDATION_LIMITS.password}
            value={values.confirmPassword}
            onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={!email}>
          Aggiorna password
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-300">
        Non hai ricevuto il codice?{" "}
        <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/forgot-password">
          Richiedine uno nuovo
        </Link>
      </p>
    </AuthCard>
  );
}
