// File: types.ts
// Scopo: Definisce i payload della funzionalita utente.
// Livello: Tipi feature

export type UpdateCurrentUserPayload = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};
