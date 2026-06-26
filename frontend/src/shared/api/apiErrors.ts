// FILE: apiErrors.ts
// Purpose: Normalizes backend API error payloads for forms and inline messages.
// Layer: Shared API utility
// Exports: parseApiFieldErrors, parseApiMessage

type ApiErrorResponse = {
  response?: {
    data?: unknown;
  };
};

type ApiErrorData = Record<string, string | string[]>;

function apiErrorData(error: unknown): ApiErrorData {
  if (typeof error !== "object" || error === null || !("response" in error)) return {};

  const response = (error as ApiErrorResponse).response;
  const data = response?.data;

  if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
  return data as ApiErrorData;
}

export function parseApiFieldErrors<T extends Record<string, string>>(error: unknown): T {
  return Object.fromEntries(
    Object.entries(apiErrorData(error)).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  ) as T;
}

export function parseApiMessage(
  error: unknown,
  fieldNames: string[],
  fallbackMessage: string,
): string {
  const data = apiErrorData(error);

  for (const fieldName of fieldNames) {
    const value = data[fieldName];
    if (Array.isArray(value) && value[0]) return value[0];
    if (typeof value === "string" && value) return value;
  }

  return fallbackMessage;
}
