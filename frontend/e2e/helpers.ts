// FILE: helpers.ts
// Purpose: Provides small reusable actions for REGEXRIDDLE E2E flows.
// Layer: E2E test utilities
// Exports: user, session, challenge, and attempt helpers
// Depends on: @playwright/test and the app's accessible form labels

import { expect, type Page } from "@playwright/test";

export type TestUser = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username: string;
};

export type TestChallenge = {
  description: string;
  detailPath?: string;
  negativeControl: string;
  negativeExample: string;
  positiveControl: string;
  positiveExample: string;
  secretRegex: string;
  title: string;
};

// Builds unique user data so repeated test runs do not collide with existing rows.
export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return {
    email: `student_${id}@example.com`,
    firstName: "Test",
    lastName: "Runner",
    password: "StrongPass123!",
    username: `student${id.slice(-9)}`,
    ...overrides,
  };
}

// Builds a valid challenge using a compact regex that is easy to explain.
export function makeChallenge(overrides: Partial<TestChallenge> = {}): TestChallenge {
  const id = Date.now();

  return {
    description: `Percorso E2E ${id}: riconosci due lettere maiuscole e tre numeri.`,
    negativeControl: "zz999",
    negativeExample: "aa123",
    positiveControl: "CD456",
    positiveExample: "AB123",
    secretRegex: "[A-Z]{2}[0-9]{3}",
    title: `Riddle E2E ${id}`,
    ...overrides,
  };
}

// Fills the registration page; callers decide whether to submit and what to assert.
export async function fillRegistration(page: Page, user: TestUser): Promise<void> {
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(user.firstName);
  await page.getByRole("textbox", { name: "Cognome" }).fill(user.lastName);
  await page.locator('input[autocomplete="new-password"]').fill(user.password);
}

// Registers a user from the UI and waits for the authenticated challenge catalog.
export async function signUp(page: Page, user = makeUser()): Promise<TestUser> {
  await page.goto("/register");
  await fillRegistration(page, user);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Regex riddle pubblicati" })).toBeVisible();
  return user;
}

// Logs in through the browser and confirms that private navigation is available.
export async function signIn(page: Page, user: Pick<TestUser, "email" | "password">): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("link", { name: "Classifica" })).toBeVisible();
}

// Ends the current session and waits for the public landing page.
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
}

// Fills the challenge form with either valid or intentionally invalid values.
export async function fillChallenge(page: Page, challenge: TestChallenge): Promise<void> {
  await page.getByLabel("Titolo").fill(challenge.title);
  await page.getByLabel("Descrizione").fill(challenge.description);
  await page.getByLabel("Regex segreta").fill(challenge.secretRegex);
  await page.getByLabel("Esempio positivo").fill(challenge.positiveExample);
  await page.getByLabel("Esempio negativo").fill(challenge.negativeExample);
  await page.getByPlaceholder("AB123", { exact: true }).fill(challenge.positiveControl);
  await page.getByPlaceholder("ab123", { exact: true }).fill(challenge.negativeControl);
}

// Publishes a challenge and returns the direct detail URL discovered from its catalog card.
export async function createChallenge(page: Page, challenge = makeChallenge()): Promise<TestChallenge> {
  await page.goto("/challenges/new");
  await expect(page.getByRole("heading", { name: "Crea un regex riddle" })).toBeVisible();

  await fillChallenge(page, challenge);
  await page.getByRole("button", { name: "Pubblica sfida" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: challenge.title })).toBeVisible();
  const detailPath = await page
    .getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) })
    .getAttribute("href");

  return { ...challenge, detailPath: detailPath ?? undefined };
}

// Opens the challenge detail using the stored direct URL when available.
export async function openChallenge(page: Page, challenge: Pick<TestChallenge, "detailPath" | "title">): Promise<void> {
  if (challenge.detailPath) {
    await page.goto(challenge.detailPath);
  } else {
    await page.goto("/challenges");
    await page.getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) }).click();
  }

  await expect(page).toHaveURL(/\/challenges\/\d+/);
  await expect(page.getByRole("heading", { name: challenge.title })).toBeVisible();
}

// Submits a regex attempt and waits for the backend to persist it.
export async function sendAttempt(page: Page, proposedRegex: string): Promise<void> {
  const attemptResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/challenges/") &&
      response.url().endsWith("/attempts") &&
      response.request().method() === "POST",
  );

  await page.getByLabel("Regex proposta").fill(proposedRegex);
  await page.getByRole("button", { name: "Invia tentativo" }).click();
  expect((await attemptResponse).status()).toBe(201);
}
