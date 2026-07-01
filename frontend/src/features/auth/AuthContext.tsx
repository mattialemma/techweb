// File: AuthContext.tsx
// Scopo: Coordina stato sessione, query utente corrente e azioni auth condivise.
// Livello: Provider feature
// Esporta: AuthProvider

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { clearAccessToken, setAccessToken } from "@shared/api/client";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "./api";
import { AuthContext, meQueryKey, type AuthContextValue } from "./context";
import type { AuthUser, LoginResponse, RegisterPayload } from "./types";

function storeAuthenticatedUser(queryClient: QueryClient, session: LoginResponse): AuthUser {
  setAccessToken(session.accessToken);
  queryClient.setQueryData(meQueryKey, session.user);
  return session.user;
}

function discardAuthenticatedUser(queryClient: QueryClient): void {
  clearAccessToken();
  queryClient.removeQueries({ queryKey: meQueryKey });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasSessionToken, setHasSessionToken] = useState(false);

  useEffect(() => {
    let isMounted = true;

    refreshAccessToken()
      .then((freshToken) => {
        if (!isMounted) return;
        if (!freshToken) {
          clearAccessToken();
          setHasSessionToken(false);
          return;
        }
        setAccessToken(freshToken);
        setHasSessionToken(true);
      })
      .catch(() => {
        if (!isMounted) return;
        clearAccessToken();
        setHasSessionToken(false);
      })
      .finally(() => {
        if (isMounted) setIsSessionReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const meQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: getCurrentUser,
    enabled: isSessionReady && hasSessionToken,
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (session) => {
      storeAuthenticatedUser(queryClient, session);
      setHasSessionToken(true);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (registration: RegisterPayload) => {
      await registerUser(registration);
      return loginUser({ email: registration.email, password: registration.password });
    },
    onSuccess: (session) => {
      storeAuthenticatedUser(queryClient, session);
      setHasSessionToken(true);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      discardAuthenticatedUser(queryClient);
      setHasSessionToken(false);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading:
        !isSessionReady ||
        meQuery.isLoading ||
        loginMutation.isPending ||
        registerMutation.isPending ||
        logoutMutation.isPending,
      isAuthenticated: Boolean(meQuery.data),
      login: async (credentials) => {
        const session = await loginMutation.mutateAsync(credentials);
        return session.user;
      },
      register: async (registration) => {
        const session = await registerMutation.mutateAsync(registration);
        return session.user;
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [
      isSessionReady,
      loginMutation,
      logoutMutation,
      meQuery.data,
      meQuery.isLoading,
      registerMutation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
