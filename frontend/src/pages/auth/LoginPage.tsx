// File: LoginPage.tsx
// Scopo: Gestisce login pubblico e redirect verso la rotta richiesta.
// Livello: Pagina auth
// Dipende da: contesto autenticazione, validazione login, UI form condivisa

import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth, validateLogin, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, Input, PasswordInput } from "@shared/ui";

const INVALID_CREDENTIALS_MESSAGE = "Email o password non corretti.";
const initialLoginDraft = { email: "", password: "" };

type LoginDraft = typeof initialLoginDraft;

function redirectAfterLogin(locationState: unknown): string {
  return (locationState as { from?: string } | null)?.from ?? "/challenges";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginDraft, setLoginDraft] = useState<LoginDraft>(initialLoginDraft);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateLoginField(field: keyof LoginDraft, value: string) {
    setSubmitError("");
    setLoginDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateLogin(loginDraft);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await login(loginDraft);
      navigate(redirectAfterLogin(location.state), { replace: true });
    } catch {
      setSubmitError(INVALID_CREDENTIALS_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Bentornato" subtitle="Accedi per creare sfide e risolvere RegexLab.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={loginDraft.email}
            onChange={(event) => updateLoginField("email", event.target.value)}
          />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <PasswordInput
            autoComplete="current-password"
            maxLength={VALIDATION_LIMITS.password}
            value={loginDraft.password}
            onChange={(event) => updateLoginField("password", event.target.value)}
          />
        </FormField>
        {submitError ? (
          <p aria-live="polite" className="-mt-2 text-sm text-red-300">
            {submitError}
          </p>
        ) : null}
        <div className="text-right">
          <Link
            className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            to="/forgot-password"
          >
            Password dimenticata?
          </Link>
        </div>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Login
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-300">
        Non hai un account?{" "}
        <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/register">
          Registrati
        </Link>
      </p>
    </AuthCard>
  );
}
