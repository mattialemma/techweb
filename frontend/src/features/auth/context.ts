// File: context.ts
// Scopo: Definisce contratto e chiave cache condivisi dal provider autenticazione.
// Livello: Contesto feature
// Esporta: AuthContext, AuthContextValue, meQueryKey

import { createContext } from "react";

import type { AuthUser, LoginPayload, RegisterPayload } from "./types";

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  register: (registration: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
export const meQueryKey = ["me"] as const;
