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

export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} obbligatorio.`;
}

export function maxLength(value: string, max: number): string | null {
  return value.length > max ? `Massimo ${max} caratteri.` : null;
}

export function validateEmailFormat(email: string): string | null {
  if (!email.trim()) return "Email obbligatoria.";
  if (email.length > VALIDATION_LIMITS.email) {
    return `Massimo ${VALIDATION_LIMITS.email} caratteri.`;
  }
  if (!email.includes("@")) return "Inserisci un'email valida con @.";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || !domain.includes(".")) return "Inserisci un'email valida.";
  return null;
}

export function validatePasswordComplexity(password: string): string | null {
  if (!password) return "Password obbligatoria.";
  if (password.length < 8) return "La password deve avere almeno 8 caratteri.";
  if (password.length > VALIDATION_LIMITS.password) {
    return `Massimo ${VALIDATION_LIMITS.password} caratteri.`;
  }
  if (!/[a-z]/.test(password)) return "Serve almeno una lettera minuscola.";
  if (!/[A-Z]/.test(password)) return "Serve almeno una lettera maiuscola.";
  if (!/[0-9]/.test(password)) return "Serve almeno un numero.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Serve almeno un carattere speciale.";
  return null;
}

export function validateRegexSyntax(pattern: string): string | null {
  try {
    new RegExp(pattern);
    return null;
  } catch {
    return "Regex non valida.";
  }
}
