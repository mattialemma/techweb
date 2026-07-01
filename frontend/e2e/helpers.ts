// File: helpers.ts
// Scopo: Fornisce funzioni Playwright riutilizzabili per i flussi E2E utente.
// Livello: Utilita test E2E
// Esporta: funzioni per sfide e autenticazione usate dalle suite E2E
// Dipende da: @playwright/test e dalle pagine pubbliche di autenticazione dell'app

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

// Crea dati utente resistenti alle collisioni per rieseguire i test sullo stesso DB di sviluppo.
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

// Crea una bozza valida di sfida regex con titolo univoco per esecuzioni ripetibili.
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

// Compila il modulo di creazione sfida senza inviarlo, cosi i test di validazione possono riusarlo.
export async function fillChallengeForm(page: Page, challenge: E2EChallenge): Promise<void> {
  await page.getByLabel("Titolo").fill(challenge.title);
  await page.getByLabel("Descrizione").fill(challenge.description);
  await page.getByLabel("Regex segreta").fill(challenge.secretRegex);
  await page.getByLabel("Esempio positivo").fill(challenge.positiveExample);
  await page.getByLabel("Esempio negativo").fill(challenge.negativeExample);
  await page.getByPlaceholder("AB123", { exact: true }).fill(challenge.positiveControl);
  await page.getByPlaceholder("ab123", { exact: true }).fill(challenge.negativeControl);
}

// Pubblica una sfida valida dalla UI e attende che compaia nel catalogo.
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

// Apre il dettaglio sfida dalla scheda del catalogo con titolo corrispondente.
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

// Invia una regex proposta dal pannello del dettaglio sfida.
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

// Compila il modulo di registrazione senza inviarlo, utile per test positivi e negativi.
export async function fillRegisterForm(page: Page, user: E2EUser): Promise<void> {
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(user.firstName);
  await page.getByRole("textbox", { name: "Cognome" }).fill(user.lastName);
  await page.locator('input[autocomplete="new-password"]').fill(user.password);
}

// Effettua il login dalla pagina pubblica e attende la schermata privata del catalogo.
export async function loginUser(page: Page, user: Pick<E2EUser, "email" | "password">): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("Email").fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Enigmi pubblicati" })).toBeVisible();
}

// Conferma il logout in due passaggi e attende la schermata pubblica di login.
export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByRole("button", { name: "Ok" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
}

// Registra un utente dalla UI e attende la pagina privata delle sfide.
export async function registerUser(page: Page, user = createUniqueUser()): Promise<E2EUser> {
  await page.goto("/register");

  await fillRegisterForm(page, user);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page).toHaveURL(/\/challenges/);
  await expect(page.getByRole("heading", { name: "Enigmi pubblicati" })).toBeVisible();

  return user;
}
