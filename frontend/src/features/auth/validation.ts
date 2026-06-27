import type { RegisterPayload } from "./types";
import {
  VALIDATION_LIMITS,
  maxLength,
  required,
  validateEmailFormat,
  validatePasswordComplexity,
} from "@shared/lib/validation";

export type ValidationErrors = Record<string, string>;

export function validateEmail(email: string): string | null {
  return validateEmailFormat(email);
}

export function validateLogin(values: { email: string; password: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Password obbligatoria.";
  return errors;
}

export function validateOtpCode(code: string): string | null {
  if (!code.trim()) return "Codice obbligatorio.";
  if (!/^\d{6}$/.test(code)) return "Il codice deve avere 6 cifre.";
  return null;
}

export function validatePasswordReset(values: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailError = validateEmail(values.email);
  const codeError = validateOtpCode(values.code);
  const passwordError = validatePasswordComplexity(values.newPassword);

  if (emailError) errors.email = emailError;
  if (codeError) errors.code = codeError;
  if (passwordError) errors.newPassword = passwordError;
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Le password non coincidono.";
  }

  return errors;
}

export function validatePasswordChange(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const passwordError = validatePasswordComplexity(values.newPassword);

  if (!values.currentPassword) errors.currentPassword = "Password attuale obbligatoria.";
  if (values.currentPassword.length > VALIDATION_LIMITS.password) {
    errors.currentPassword = `Massimo ${VALIDATION_LIMITS.password} caratteri.`;
  }
  if (passwordError) errors.newPassword = passwordError;
  if (values.currentPassword && values.currentPassword === values.newPassword) {
    errors.newPassword = "La nuova password deve essere diversa.";
  }
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Le password non coincidono.";
  }

  return errors;
}

export function validateRegister(values: RegisterPayload): ValidationErrors {
  const errors: ValidationErrors = {};
  const username = values.username.trim();
  const emailError = validateEmail(values.email);
  const passwordError = validatePasswordComplexity(values.password);

  if (!username) errors.username = "Username obbligatorio.";
  if (username.length > VALIDATION_LIMITS.username) {
    errors.username = `Massimo ${VALIDATION_LIMITS.username} caratteri.`;
  }
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  const firstNameRequired = required(values.firstName, "Nome");
  const lastNameRequired = required(values.lastName, "Cognome");
  const firstNameError = maxLength(values.firstName ?? "", VALIDATION_LIMITS.name);
  const lastNameError = maxLength(values.lastName ?? "", VALIDATION_LIMITS.name);
  if (firstNameRequired || firstNameError) errors.firstName = firstNameRequired ?? firstNameError ?? "";
  if (lastNameRequired || lastNameError) errors.lastName = lastNameRequired ?? lastNameError ?? "";

  return errors;
}

export function validateProfile(values: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailError = validateEmail(values.email);

  if (!values.username.trim()) errors.username = "Username obbligatorio.";
  if (values.username.length > VALIDATION_LIMITS.username) {
    errors.username = `Massimo ${VALIDATION_LIMITS.username} caratteri.`;
  }
  if (emailError) errors.email = emailError;
  const firstNameRequired = required(values.firstName, "Nome");
  const lastNameRequired = required(values.lastName, "Cognome");
  const firstNameError = maxLength(values.firstName, VALIDATION_LIMITS.name);
  const lastNameError = maxLength(values.lastName, VALIDATION_LIMITS.name);
  if (firstNameRequired || firstNameError) errors.firstName = firstNameRequired ?? firstNameError ?? "";
  if (lastNameRequired || lastNameError) errors.lastName = lastNameRequired ?? lastNameError ?? "";

  return errors;
}

export function validateAvatar(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Seleziona un file immagine.";
  if (file.size > VALIDATION_LIMITS.avatarBytes) return "L'avatar deve pesare al massimo 2 MB.";
  return null;
}
