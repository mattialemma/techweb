// File: client.ts
// Scopo: Client Axios condivisi per chiamate API autenticate, refresh token e CSRF.
// Livello: Client API
// Dipende da: Axios, endpoint backend CSRF, stato del token JWT di accesso.

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const apiRoutes = {
  csrfToken: "/security/csrf-token",
  refreshAccessToken: "/sessions/current/access-token",
} as const;

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

function makeHttpClient() {
  return axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    withCredentials: true,
  });
}

const apiClient = makeHttpClient();
const refreshClient = makeHttpClient();
const csrfClient = makeHttpClient();

function isUnsafeMethod(method: string | undefined): boolean {
  return ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());
}

function isSecurityTokenUrl(url: string | undefined): boolean {
  return Boolean(url?.includes(apiRoutes.csrfToken));
}

function isSessionOrSecurityUrl(url: string): boolean {
  return url.includes("/sessions") || url.includes(apiRoutes.csrfToken);
}

function applyBearerHeader(config: InternalAxiosRequestConfig): void {
  if (!accessToken) return;
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${accessToken}`;
}

async function applyCsrfHeader(config: InternalAxiosRequestConfig): Promise<void> {
  if (!isUnsafeMethod(config.method) || isSecurityTokenUrl(config.url)) return;
  config.headers = config.headers ?? {};
  config.headers["X-CSRFToken"] = await ensureCsrfToken();
}

async function ensureCsrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = csrfClient
      .get<{ csrfToken: string }>(apiRoutes.csrfToken)
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
    const csrfToken = await ensureCsrfToken();
    refreshPromise = refreshClient
      .post<{ accessToken?: string }>(
        apiRoutes.refreshAccessToken,
        {},
        { headers: { "X-CSRFToken": csrfToken } },
      )
      .then(({ data, status }) => {
        if (status === 204 || !data.accessToken) {
          clearAccessToken();
          throw new Error("No refresh session available.");
        }
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
  applyBearerHeader(config);
  await applyCsrfHeader(config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const shouldSkipRefresh = isSessionOrSecurityUrl(requestUrl);

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    await refreshAccessToken();
    return apiClient(originalRequest);
  },
);

export default apiClient;
