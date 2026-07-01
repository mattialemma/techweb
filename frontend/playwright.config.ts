// File: playwright.config.ts
// Scopo: Configura i test E2E Playwright sull'app Vite locale.
// Livello: Configurazione test
// Esporta: risultato di defineConfig per Playwright
// Dipende da: @playwright/test

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
