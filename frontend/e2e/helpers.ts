// FILE: helpers.ts
// Purpose: Provides reusable Playwright helpers for user-oriented E2E flows.
// Layer: E2E test utilities
// Exports: challenge and auth helpers used by the E2E test suites
// Depends on: @playwright/test and the app's public auth pages

import { expect, type Page } from "@playwright/test";

export type E2EUser = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username: string;
};

export type E2EChallenge = {
  description: string;
  detailPath?: string;
  negativeControl: string;
  negativeExample: string;
  positiveControl: string;
  positiveExample: string;
  secretRegex: string;
  title: string;
};

// Creates collision-resistant user data so tests can be rerun on the same dev DB.
export function createUniqueUser(): E2EUser {
  const id = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    email: `e2e_${id}@example.com`,
    firstName: "E2E",
    lastName: "Tester",
    password: "StrongPass123!",
    username: `e2e_${id}`,
  };
}

// Creates a valid regex challenge draft with a unique title for repeatable runs.
export function createUniqueChallenge(): E2EChallenge {
  const id = Date.now();

  return {
    description: `Sfida E2E ${id} creata automaticamente da Playwright.`,
    negativeControl: "xy999",
    negativeExample: "ab123",
    positiveControl: "CD456",
    positiveExample: "AB123",
    secretRegex: "[A-Z]{2}[0-9]{3}",
    title: `Sfida E2E ${id}`,
  };
}

// Fills the challenge creation form without submitting it, so validation tests can reuse it.
export async function fillChallengeForm(page: Page, challenge: E2EChallenge): Promise<void> {
  await page.getByLabel("Titolo").fill(challenge.title);
  await page.getByLabel("Descrizione").fill(challenge.description);
  await page.getByLabel("Regex segreta").fill(challenge.secretRegex);
  await page.getByLabel("Esempio positivo").fill(challenge.positiveExample);
  await page.getByLabel("Esempio negativo").fill(challenge.negativeExample);
  await page.getByPlaceholder("AB123", { exact: true }).fill(challenge.positiveControl);
  await page.getByPlaceholder("ab123", { exact: true }).fill(challenge.negativeControl);
}

// Publishes a valid challenge from the UI and waits until it appears in the catalog.
export async function publishChallenge(page: Page, challenge = createUniqueChallenge()): Promise<E2EChallenge> {
  await page.goto("/challenges/new");

  await fillChallengeForm(page, challenge);
  await page.getByRole("button", { name: "Pubblica sfida" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Enigmi pubblicati" })).toBeVisible();
  await expect(page.getByRole("heading", { name: challenge.title })).toBeVisible();
  const detailPath = await page
    .getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) })
    .getAttribute("href");

  return { ...challenge, detailPath: detailPath ?? undefined };
}

// Opens a challenge detail page from the catalog card with the matching title.
export async function openChallengeDetail(
  page: Page,
  challenge: Pick<E2EChallenge, "detailPath" | "title">,
): Promise<void> {
  if (challenge.detailPath) {
    await page.goto(challenge.detailPath);
  } else {
    await page.goto("/challenges");
    await page.getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) }).click();
  }

  await expect(page).toHaveURL(/\/challenges\/\d+/);
  await expect(page.getByRole("heading", { name: challenge.title })).toBeVisible();
}

// Submits a proposed regex from the challenge detail workbench.
export async function submitAttempt(page: Page, proposedRegex: string): Promise<void> {
  const attemptResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/challenges/") &&
      response.url().endsWith("/attempts") &&
      response.request().method() === "POST",
  );

  await page.getByLabel("Regex proposta").fill(proposedRegex);
  await page.getByRole("button", { name: "Verifica regex" }).click();
  expect((await attemptResponse).status()).toBe(201);
}

// Fills the registration form without submitting it, useful for positive and negative tests.
export async function fillRegisterForm(page: Page, user: E2EUser): Promise<void> {
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(user.firstName);
  await page.getByRole("textbox", { name: "Cognome" }).fill(user.lastName);
  await page.locator('input[autocomplete="new-password"]').fill(user.password);
}

// Logs in from the public login page and waits for the private catalog screen.
export async function loginUser(page: Page, user: Pick<E2EUser, "email" | "password">): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("Email").fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Enigmi pubblicati" })).toBeVisible();
}

// Confirms the two-step logout control and waits until the public login screen is shown.
export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByRole("button", { name: "Ok" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
}

// Registers through the UI and waits until the private challenges page is visible.
export async function registerUser(page: Page, user = createUniqueUser()): Promise<E2EUser> {
  await page.goto("/register");

  await fillRegisterForm(page, user);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Enigmi pubblicati" })).toBeVisible();

  return user;
}
