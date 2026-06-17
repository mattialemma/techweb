import apiClient from "@shared/api/client";
import type { AuthUser } from "@features/auth/types";
import type { UpdateCurrentUserPayload } from "./types";

export async function updateCurrentUser(payload: UpdateCurrentUserPayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/users/me", payload);
  return data;
}

export async function uploadCurrentUserAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.put<AuthUser>("/users/me/avatar", formData);
  return data;
}

export async function deleteCurrentUserAvatar(): Promise<void> {
  await apiClient.delete("/users/me/avatar");
}
