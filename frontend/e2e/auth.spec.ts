// FILE: auth.spec.ts
// Purpose: Covers authentication-related user journeys through the browser.
// Layer: E2E test suite
// Exports: Playwright tests
// Depends on: helpers.ts and the running frontend/backend stack

import { expect, test } from "@playwright/test";

import { createUniqueUser, fillRegisterForm, loginUser, logoutUser, registerUser } from "./helpers";

test("un visitatore puo registrarsi e accedere agli enigmi", async ({ page }) => {
  await registerUser(page);

  await expect(page.getByRole("link", { name: "Podio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nuova sfida" })).toBeVisible();
});

test("la registrazione mostra un errore se l'email non e valida", async ({ page }) => {
  const user = { ...createUniqueUser(), email: "email-non-valida" };

  await page.goto("/register");
  await fillRegisterForm(page, user);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByText("Inserisci un'email valida con @.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crea account" })).toBeVisible();
});

test("un utente registrato puo fare login con credenziali corrette", async ({ page }) => {
  const user = await registerUser(page);

  await logoutUser(page);
  await loginUser(page, user);

  await expect(page.getByRole("link", { name: "Podio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("il login rifiuta una password errata e resta sulla pagina pubblica", async ({ page }) => {
  const user = await registerUser(page);

  await logoutUser(page);
  await page.getByLabel("Email").fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill("PasswordSbagliata123!");
  const failedLogin = page.waitForResponse(
    (response) => response.url().endsWith("/api/sessions") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Login" }).click();

  expect((await failedLogin).status()).toBe(401);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeHidden();
});

test("un visitatore non autenticato viene reindirizzato al login da una rotta protetta", async ({ page }) => {
  await page.goto("/challenges/new");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nuova sfida" })).toBeHidden();
});
