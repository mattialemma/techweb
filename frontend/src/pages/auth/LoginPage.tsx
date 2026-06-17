import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth, validateLogin, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input } from "@shared/ui";

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Accesso non riuscito. Controlla le credenziali.";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await login(values);
      const from = (location.state as { from?: string } | null)?.from ?? "/challenges";
      navigate(from, { replace: true });
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Bentornato" subtitle="Accedi per creare sfide e risolvere regex riddle.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <Input
            autoComplete="current-password"
            type="password"
            maxLength={VALIDATION_LIMITS.password}
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
          />
        </FormField>
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
