export type AuthUser = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type PasswordOtpVerifyResponse = {
  valid: boolean;
  expiresAt?: string | null;
};
