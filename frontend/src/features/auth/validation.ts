// File: validation.ts
// Scopo: Valida input di autenticazione, profilo e avatar prima delle chiamate API.
// Livello: Validazione feature
// Esporta: funzioni di validazione e tipo ValidationErrors

import {
  VALIDATION_LIMITS,
  maxLength,
  required,
  validateEmailFormat,
  validatePasswordComplexity,
} from "@shared/lib/validation";
import type { RegisterPayload } from "./types";

export type ValidationErrors = Record<string, string>;

type PasswordResetValues = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type EditableProfileValues = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
};

function assignError(errors: ValidationErrors, fieldName: string, message: string | null): void {
  if (message) errors[fieldName] = message;
}

function inspectPersonName(value: string, label: string): string | null {
  return required(value, label) ?? maxLength(value, VALIDATION_LIMITS.name);
}

function inspectUsername(username: string): string | null {
  if (!username.trim()) return "Username obbligatorio.";
  return maxLength(username, VALIDATION_LIMITS.username);
}

export function validateEmail(email: string): string | null {
  return validateEmailFormat(email);
}

export function validateOtpCode(code: string): string | null {
  if (!code.trim()) return "Codice obbligatorio.";
  if (!/^\d{6}$/.test(code)) return "Il codice deve avere 6 cifre.";
  return null;
}

export function validateLogin(credentials: { email: string; password: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  assignError(errors, "email", validateEmail(credentials.email));
  if (!credentials.password) errors.password = "Password obbligatoria.";
  return errors;
}

export function validatePasswordChange(passwords: PasswordChangeValues): ValidationErrors {
  const errors: ValidationErrors = {};
  const nextPasswordError = validatePasswordComplexity(passwords.newPassword);

  if (!passwords.currentPassword) errors.currentPassword = "Password attuale obbligatoria.";
  if (passwords.currentPassword.length > VALIDATION_LIMITS.password) {
    errors.currentPassword = `Massimo ${VALIDATION_LIMITS.password} caratteri.`;
  }
  if (nextPasswordError) errors.newPassword = nextPasswordError;
  if (passwords.currentPassword && passwords.currentPassword === passwords.newPassword) {
    errors.newPassword = "La nuova password deve essere diversa.";
  }
  if (passwords.confirmPassword !== passwords.newPassword) {
    errors.confirmPassword = "Le password non coincidono.";
  }

  return errors;
}

export function validatePasswordReset(resetValues: PasswordResetValues): ValidationErrors {
  const errors: ValidationErrors = {};

  assignError(errors, "email", validateEmail(resetValues.email));
  assignError(errors, "code", validateOtpCode(resetValues.code));
  assignError(errors, "newPassword", validatePasswordComplexity(resetValues.newPassword));
  if (resetValues.confirmPassword !== resetValues.newPassword) {
    errors.confirmPassword = "Le password non coincidono.";
  }

  return errors;
}

export function validateProfile(profile: EditableProfileValues): ValidationErrors {
  const errors: ValidationErrors = {};

  assignError(errors, "username", inspectUsername(profile.username));
  assignError(errors, "email", validateEmail(profile.email));
  assignError(errors, "firstName", inspectPersonName(profile.firstName, "Nome"));
  assignError(errors, "lastName", inspectPersonName(profile.lastName, "Cognome"));

  return errors;
}

export function validateRegister(registration: RegisterPayload): ValidationErrors {
  const errors = validateProfile({
    username: registration.username.trim(),
    email: registration.email,
    firstName: registration.firstName,
    lastName: registration.lastName,
  });

  assignError(errors, "password", validatePasswordComplexity(registration.password));

  return errors;
}

export function validateAvatar(candidateFile: File): string | null {
  if (!candidateFile.type.startsWith("image/")) return "Seleziona un file immagine.";
  if (candidateFile.size > VALIDATION_LIMITS.avatarBytes) return "L'avatar deve pesare al massimo 2 MB.";
  return null;
}
