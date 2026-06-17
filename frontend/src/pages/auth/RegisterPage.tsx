import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth, validateRegister, type RegisterPayload, type ValidationErrors } from "@features/auth";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import { AuthCard, Button, FormField, InlineMessage, Input } from "@shared/ui";

function fieldErrorsFromApi(error: unknown): ValidationErrors {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return {};
  }
  const response = (error as { response?: { data?: Record<string, string[] | string> } }).response;
  const data = response?.data ?? {};
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterPayload>({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({
        ...values,
        username: values.username.trim(),
        email: values.email.trim(),
      });
      navigate("/challenges", { replace: true });
    } catch (error) {
      const apiErrors = fieldErrorsFromApi(error);
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
            value={values.username}
            onChange={(event) => setValues({ ...values, username: event.target.value })}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input
            autoComplete="email"
            inputMode="email"
            maxLength={VALIDATION_LIMITS.email}
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={errors.firstName}>
            <Input
              autoComplete="given-name"
              maxLength={VALIDATION_LIMITS.name}
              value={values.firstName}
              onChange={(event) => setValues({ ...values, firstName: event.target.value })}
            />
          </FormField>
          <FormField label="Cognome" error={errors.lastName}>
            <Input
              autoComplete="family-name"
              maxLength={VALIDATION_LIMITS.name}
              value={values.lastName}
              onChange={(event) => setValues({ ...values, lastName: event.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Password" error={errors.password}>
          <Input
            autoComplete="new-password"
            type="password"
            maxLength={VALIDATION_LIMITS.password}
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
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
