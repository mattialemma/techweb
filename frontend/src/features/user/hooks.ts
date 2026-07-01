// File: hooks.ts
// Scopo: Espone mutation React Query per aggiornare profilo e avatar correnti.
// Livello: Hook feature
// Esporta: hook di aggiornamento profilo/avatar

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { meQueryKey } from "@features/auth/context";
import type { AuthUser } from "@features/auth/types";
import {
  clearCurrentAvatar,
  saveCurrentAvatar,
  saveCurrentProfile,
} from "./api";

function replaceCurrentUserCache(
  queryClient: ReturnType<typeof useQueryClient>,
  nextUser: AuthUser,
): void {
  queryClient.setQueryData<AuthUser>(meQueryKey, nextUser);
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveCurrentProfile,
    onSuccess: (savedUser) => {
      replaceCurrentUserCache(queryClient, savedUser);
    },
  });
}

export function useUploadCurrentUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveCurrentAvatar,
    onSuccess: (savedUser) => {
      replaceCurrentUserCache(queryClient, savedUser);
    },
  });
}

export function useDeleteCurrentUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCurrentAvatar,
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | undefined>(meQueryKey, (cachedUser) =>
        cachedUser ? { ...cachedUser, avatarUrl: null } : cachedUser,
      );
    },
  });
}
