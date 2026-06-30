// FILE: client.ts
// Purpose: Shared Axios clients for authenticated API calls, token refresh, and CSRF.
// Layer: API client
// Depends on: Axios, backend CSRF token endpoint, JWT access-token state.

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let csrfPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

const csrfClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

function isUnsafeMethod(method: string | undefined): boolean {
  return ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());
}

async function ensureCsrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = csrfClient
      .get<{ csrfToken: string }>("/security/csrf-token")
      .then(({ data }) => {
        return data.csrfToken;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const token = await ensureCsrfToken();
    refreshPromise = refreshClient
      .post<{ accessToken: string }>(
        "/sessions/current/access-token",
        {},
        { headers: { "X-CSRFToken": token } },
      )
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (isUnsafeMethod(config.method) && !config.url?.includes("/security/csrf-token")) {
    config.headers = config.headers ?? {};
    config.headers["X-CSRFToken"] = await ensureCsrfToken();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest =
      requestUrl.includes("/sessions") || requestUrl.includes("/security/csrf-token");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    await refreshAccessToken();
    return apiClient(originalRequest);
  },
);

export default apiClient;
