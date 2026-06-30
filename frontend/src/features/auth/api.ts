import apiClient from "@shared/api/client";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  PasswordOtpVerifyResponse,
  RegisterPayload,
} from "./types";

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/users", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/sessions", payload);
  return data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const { data, status } = await apiClient.post<{ accessToken?: string }>(
    "/sessions/current/access-token",
  );
  return status === 204 ? null : data.accessToken ?? null;
}

export async function logoutUser(): Promise<void> {
  await apiClient.delete("/sessions/current");
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/users/me");
  return data;
}

export async function requestPasswordOtp(email: string): Promise<void> {
  await apiClient.post("/password-reset-requests", { email });
}

export async function verifyPasswordOtp(
  email: string,
  code: string,
): Promise<PasswordOtpVerifyResponse> {
  const { data } = await apiClient.post<PasswordOtpVerifyResponse>(
    "/password-reset-verifications",
    { email, code },
  );
  return data;
}

export async function resetPasswordWithOtp(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post("/password-resets", { email, code, newPassword });
}

export async function changeCurrentPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.put("/users/me/password", { currentPassword, newPassword });
}
