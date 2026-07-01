// File: index.ts
// Scopo: Riesporta client, parser errori e configurazione query condivisi.
// Livello: Barile API condiviso

export { default as apiClient } from "./client";
export * from "./apiErrors";
export * from "./client";
export * from "./queryClient";
