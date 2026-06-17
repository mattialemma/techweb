import { useMutation, useQueryClient } from "@tanstack/react-query";

import { meQueryKey } from "@features/auth/context";
import type { AuthUser } from "@features/auth/types";
import {
  deleteCurrentUserAvatar,
  updateCurrentUser,
  uploadCurrentUserAvatar,
} from "./api";

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(meQueryKey, user);
    },
  });
}

export function useUploadCurrentUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCurrentUserAvatar,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(meQueryKey, user);
    },
  });
}

export function useDeleteCurrentUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCurrentUserAvatar,
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | undefined>(meQueryKey, (current) =>
        current ? { ...current, avatarUrl: null } : current,
      );
    },
  });
}
