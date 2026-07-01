// FILE: public-auth.spec.ts
// Purpose: Exercises public pages, authentication, and route protection.
// Layer: E2E test suite
// Exports: Playwright tests
// Depends on: helpers.ts and the running REGEXRIDDLE stack

import { expect, test } from "@playwright/test";

import { fillRegistration, makeUser, signIn, signOut, signUp } from "./helpers";

test.afterEach(async ({ page }) => {
  await page.waitForTimeout(4_000);
});

test("la home pubblica presenta il gioco e porta alle regole", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByText("REGEXRIDDLE")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Risolvi enigmi testuali scrivendo la regex giusta." })).toBeVisible();
  await page.getByRole("button", { name: "Come funziona" }).click();
  await expect(page.getByRole("heading", { name: "Una sfida tra logica, pattern e deduzione." })).toBeVisible();
});

test("un visitatore anonimo non apre direttamente la classifica", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
});

test("la registrazione segnala una password troppo debole", async ({ page }) => {
  const user = makeUser({ password: "short" });

  await page.goto("/register");
  await fillRegistration(page, user);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByText("La password deve avere almeno 8 caratteri.")).toBeVisible();
});

test("un account appena creato puo uscire e rientrare", async ({ page }) => {
  const user = await signUp(page);

  await signOut(page);
  await signIn(page, user);

  await expect(page.getByRole("link", { name: "Sfide" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("il login con credenziali sbagliate resta nella pagina pubblica", async ({ page }) => {
  const user = await signUp(page);

  await signOut(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill("WrongPass123!");
  const failedLogin = page.waitForResponse(
    (response) => response.url().endsWith("/api/sessions") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Login" }).click();

  expect((await failedLogin).status()).toBe(401);
  await expect(page.getByRole("heading", { name: "Bentornato" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeHidden();
});
