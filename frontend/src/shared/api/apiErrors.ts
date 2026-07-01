// File: apiErrors.ts
// Scopo: Normalizza i payload di errore API backend per moduli e messaggi in linea.
// Livello: Utilita API condivisa
// Esporta: parseApiFieldErrors, parseApiMessage

type ApiErrorResponse = {
  response?: {
    data?: unknown;
  };
};

type ApiErrorData = Record<string, string | string[]>;

function hasApiResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === "object" && value !== null && "response" in value;
}

function isFieldErrorMap(value: unknown): value is ApiErrorData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstMessage(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readApiErrorData(error: unknown): ApiErrorData {
  if (!hasApiResponse(error)) return {};

  const payload = error.response?.data;
  return isFieldErrorMap(payload) ? payload : {};
}

export function parseApiFieldErrors<T extends Record<string, string>>(error: unknown): T {
  const entries = Object.entries(readApiErrorData(error)).map(([fieldName, fieldMessages]) => [
    fieldName,
    firstMessage(fieldMessages),
  ]);

  return Object.fromEntries(entries) as T;
}

export function parseApiMessage(
  error: unknown,
  fieldNames: string[],
  fallbackMessage: string,
): string {
  const errorData = readApiErrorData(error);

  for (const fieldName of fieldNames) {
    const message = firstMessage(errorData[fieldName]);
    if (message) return message;
  }

  return fallbackMessage;
}
