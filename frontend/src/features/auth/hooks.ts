// File: hooks.ts
// Scopo: Espone l'accesso tipizzato al contesto autenticazione.
// Livello: Hook feature
// Esporta: useAuth

import { useContext } from "react";

import { AuthContext } from "./context";

export function useAuth() {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return authState;
}
