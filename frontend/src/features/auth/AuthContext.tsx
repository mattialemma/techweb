import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clearAccessToken, setAccessToken } from "@shared/api/client";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "./api";
import { AuthContext, meQueryKey, type AuthContextValue } from "./context";
import type { RegisterPayload } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let active = true;

    refreshAccessToken()
      .then((token) => {
        if (!active) return;
        setAccessToken(token);
        setHasToken(true);
      })
      .catch(() => {
        if (!active) return;
        clearAccessToken();
        setHasToken(false);
      })
      .finally(() => {
        if (active) setHasBootstrapped(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const meQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: getCurrentUser,
    enabled: hasBootstrapped && hasToken,
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setHasToken(true);
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await registerUser(payload);
      return loginUser({ email: payload.email, password: payload.password });
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setHasToken(true);
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      clearAccessToken();
      setHasToken(false);
      queryClient.removeQueries({ queryKey: meQueryKey });
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading:
        !hasBootstrapped ||
        meQuery.isLoading ||
        loginMutation.isPending ||
        registerMutation.isPending ||
        logoutMutation.isPending,
      isAuthenticated: Boolean(meQuery.data),
      login: async (payload) => {
        const data = await loginMutation.mutateAsync(payload);
        return data.user;
      },
      register: async (payload) => {
        const data = await registerMutation.mutateAsync(payload);
        return data.user;
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [
      hasBootstrapped,
      loginMutation,
      logoutMutation,
      meQuery.data,
      meQuery.isLoading,
      registerMutation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
