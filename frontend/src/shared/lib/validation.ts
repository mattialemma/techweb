// File: validation.ts
// Scopo: Centralizza limiti e validazioni base riusate da pagine e feature.
// Livello: Utilita condivisa
// Esporta: limiti e validatori generici

export const VALIDATION_LIMITS = {
  username: 20,
  password: 20,
  email: 128,
  name: 25,
  challengeTitle: 45,
  challengeDescription: 256,
  regex: 20,
  example: 20,
  control: 20,
  maxControlsPerKind: 10,
  avatarBytes: 2 * 1024 * 1024,
} as const;

function overLimit(value: string, max: number): boolean {
  return value.length > max;
}

function hasLowercase(value: string): boolean {
  return /[a-z]/.test(value);
}

function hasUppercase(value: string): boolean {
  return /[A-Z]/.test(value);
}

function hasNumber(value: string): boolean {
  return /[0-9]/.test(value);
}

function hasSpecial(value: string): boolean {
  return /[^A-Za-z0-9]/.test(value);
}

function hasValidEmailShape(email: string): boolean {
  const [localPart, domain] = email.split("@");
  if (email.split("@").length !== 2) return false;
  return Boolean(localPart && domain && domain.includes("."));
}

export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} obbligatorio.`;
}

export function maxLength(value: string, max: number): string | null {
  return overLimit(value, max) ? `Massimo ${max} caratteri.` : null;
}

export function validateEmailFormat(email: string): string | null {
  if (!email.trim()) return "Email obbligatoria.";
  if (overLimit(email, VALIDATION_LIMITS.email)) {
    return `Massimo ${VALIDATION_LIMITS.email} caratteri.`;
  }
  if (!email.includes("@")) return "Inserisci un'email valida con @.";
  if (!hasValidEmailShape(email)) return "Inserisci un'email valida.";
  return null;
}

export function validatePasswordComplexity(password: string): string | null {
  if (!password) return "Password obbligatoria.";
  if (password.length < 8) return "La password deve avere almeno 8 caratteri.";
  if (overLimit(password, VALIDATION_LIMITS.password)) {
    return `Massimo ${VALIDATION_LIMITS.password} caratteri.`;
  }
  if (!hasLowercase(password)) return "Serve almeno una lettera minuscola.";
  if (!hasUppercase(password)) return "Serve almeno una lettera maiuscola.";
  if (!hasNumber(password)) return "Serve almeno un numero.";
  if (!hasSpecial(password)) return "Serve almeno un carattere speciale.";
  return null;
}

export function validateRegexSyntax(patternSource: string): string | null {
  try {
    new RegExp(patternSource);
    return null;
  } catch {
    return "Regex non valida.";
  }
}
