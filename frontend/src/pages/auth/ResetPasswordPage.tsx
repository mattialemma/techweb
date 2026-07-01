// File: ResetPasswordPage.tsx
// Scopo: Completa il recupero password con verifica OTP e nuova password.
// Livello: Pagina
// Dipende da: API recupero password, email nella query URL, UI autenticazione condivisa.

import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { resetPasswordWithOtp, verifyPasswordOtp } from "@features/auth/api";
import { validatePasswordReset, type ValidationErrors } from "@features/auth";
import { parseApiMessage } from "@shared/api";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input, PasswordInput } from "@shared/ui";

const emptyResetDraft = {
  code: "",
  newPassword: "",
  confirmPassword: "",
};

type ResetDraft = typeof emptyResetDraft;

function readEmailFromQuery(search: string): string {
  return new URLSearchParams(search).get("email")?.trim().toLowerCase() ?? "";
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = useMemo(() => readEmailFromQuery(location.search), [location.search]);
  const [resetDraft, setResetDraft] = useState<ResetDraft>(emptyResetDraft);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateResetField(field: keyof ResetDraft, value: string) {
    setResetDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePasswordReset({ email, ...resetDraft });
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const verification = await verifyPasswordOtp(email, resetDraft.code);
      if (!verification.valid) {
        setErrors({ code: "Codice non valido o scaduto." });
        return;
      }
      await resetPasswordWithOtp(email, resetDraft.code, resetDraft.newPassword);
      setMessage("Password aggiornata. Torno al login...");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (error) {
      setMessage(
        parseApiMessage(error, ["detail"], "Password non aggiornata. Controlla codice e nuova password."),
      );
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
            value={resetDraft.code}
            onChange={(event) => updateResetField("code", event.target.value)}
          />
        </FormField>
        <FormField label="Nuova password" error={errors.newPassword}>
          <PasswordInput
            autoComplete="new-password"
            maxLength={VALIDATION_LIMITS.password}
            value={resetDraft.newPassword}
            onChange={(event) => updateResetField("newPassword", event.target.value)}
          />
        </FormField>
        <FormField label="Conferma nuova password" error={errors.confirmPassword}>
          <PasswordInput
            autoComplete="new-password"
            maxLength={VALIDATION_LIMITS.password}
            value={resetDraft.confirmPassword}
            onChange={(event) => updateResetField("confirmPassword", event.target.value)}
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
