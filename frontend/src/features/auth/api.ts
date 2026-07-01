// File: api.ts
// Scopo: Incapsula le chiamate HTTP della funzionalita autenticazione.
// Livello: API feature
// Esporta: operazioni per sessione, utente corrente e reset password

import apiClient from "@shared/api/client";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  PasswordOtpVerifyResponse,
  RegisterPayload,
} from "./types";

const authRoutes = {
  accessToken: "/sessions/current/access-token",
  currentPassword: "/users/me/password",
  currentSession: "/sessions/current",
  currentUser: "/users/me",
  login: "/sessions",
  passwordReset: "/password-resets",
  passwordResetRequests: "/password-reset-requests",
  passwordResetVerifications: "/password-reset-verifications",
  register: "/users",
} as const;

export async function refreshAccessToken(): Promise<string | null> {
  const { data, status } = await apiClient.post<{ accessToken?: string }>(
    authRoutes.accessToken,
  );
  return status === 204 ? null : data.accessToken ?? null;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data: currentUser } = await apiClient.get<AuthUser>(authRoutes.currentUser);
  return currentUser;
}

export async function loginUser(credentials: LoginPayload): Promise<LoginResponse> {
  const { data: session } = await apiClient.post<LoginResponse>(authRoutes.login, credentials);
  return session;
}

export async function registerUser(profile: RegisterPayload): Promise<AuthUser> {
  const { data: createdUser } = await apiClient.post<AuthUser>(authRoutes.register, profile);
  return createdUser;
}

export async function logoutUser(): Promise<void> {
  await apiClient.delete(authRoutes.currentSession);
}

export async function requestPasswordOtp(emailAddress: string): Promise<void> {
  await apiClient.post(authRoutes.passwordResetRequests, { email: emailAddress });
}

export async function verifyPasswordOtp(
  emailAddress: string,
  otpCode: string,
): Promise<PasswordOtpVerifyResponse> {
  const { data: verification } = await apiClient.post<PasswordOtpVerifyResponse>(
    authRoutes.passwordResetVerifications,
    { email: emailAddress, code: otpCode },
  );
  return verification;
}

export async function resetPasswordWithOtp(
  emailAddress: string,
  otpCode: string,
  replacementPassword: string,
): Promise<void> {
  await apiClient.post(authRoutes.passwordReset, {
    email: emailAddress,
    code: otpCode,
    newPassword: replacementPassword,
  });
}

export async function changeCurrentPassword(
  currentPasswordValue: string,
  nextPasswordValue: string,
): Promise<void> {
  await apiClient.put(authRoutes.currentPassword, {
    currentPassword: currentPasswordValue,
    newPassword: nextPasswordValue,
  });
}
