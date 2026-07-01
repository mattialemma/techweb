// File: api.ts
// Scopo: Gestisce le chiamate API per profilo e avatar dell'utente corrente.
// Livello: API feature
// Esporta: operazioni di aggiornamento profilo e avatar

import apiClient from "@shared/api/client";
import type { AuthUser } from "@features/auth/types";
import type { UpdateCurrentUserPayload } from "./types";

const userRoutes = {
  avatar: "/users/me/avatar",
  profile: "/users/me",
} as const;

function buildAvatarRequestBody(imageFile: File): FormData {
  const avatarBody = new FormData();
  avatarBody.append("avatar", imageFile);
  return avatarBody;
}

export async function saveCurrentProfile(profilePatch: UpdateCurrentUserPayload): Promise<AuthUser> {
  const { data: updatedUser } = await apiClient.patch<AuthUser>(userRoutes.profile, profilePatch);
  return updatedUser;
}

export async function saveCurrentAvatar(imageFile: File): Promise<AuthUser> {
  const avatarBody = buildAvatarRequestBody(imageFile);
  const { data: updatedUser } = await apiClient.put<AuthUser>(userRoutes.avatar, avatarBody);
  return updatedUser;
}

export async function clearCurrentAvatar(): Promise<void> {
  await apiClient.delete(userRoutes.avatar);
}
