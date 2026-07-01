// FILE: riddle-flows.spec.ts
// Purpose: Covers REGEXRIDDLE challenge creation, solving, and leaderboard flows.
// Layer: E2E test suite
// Exports: Playwright tests
// Depends on: helpers.ts and the running frontend/backend stack

import { expect, test } from "@playwright/test";

import {
  createChallenge,
  makeChallenge,
  makeUser,
  fillChallenge,
  openChallenge,
  sendAttempt,
  signOut,
  signUp,
} from "./helpers";

test.afterEach(async ({ page }) => {
  await page.waitForTimeout(4_000);
});

test("un utente pubblica una sfida e la vede nel catalogo", async ({ page }) => {
  await signUp(page);

  const challenge = await createChallenge(page);
  const card = page.getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) });

  await expect(card.getByText(challenge.description)).toBeVisible();
  await expect(card.getByText(challenge.positiveExample)).toBeVisible();
  await expect(card.getByText(challenge.negativeExample)).toBeVisible();
});

test("il form sfida blocca una regex non valida", async ({ page }) => {
  await signUp(page);

  const challenge = makeChallenge({ secretRegex: "([A-Z]", positiveExample: "AB123" });
  await page.goto("/challenges/new");
  await fillChallenge(page, challenge);
  await page.getByRole("button", { name: "Pubblica sfida" }).click();

  await expect(page).toHaveURL(/\/challenges\/new/);
  await expect(page.getByText("Regex non valida.")).toBeVisible();
});

test("l'autore apre la sfida ma non vede il form dei tentativi", async ({ page }) => {
  await signUp(page);
  const challenge = await createChallenge(page);

  await openChallenge(page, challenge);

  await expect(page.getByText("Sei l'autore della sfida")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invia tentativo" })).toBeHidden();
});

test("un solver registra un tentativo non risolutivo", async ({ page }) => {
  await signUp(page);
  const challenge = await createChallenge(page);

  await signOut(page);
  await signUp(page);
  await openChallenge(page, challenge);
  await sendAttempt(page, "[A-Z]+");

  await expect(page.getByText("Feedback:")).toBeVisible();
  await expect(page.getByText("Tentativo 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Parziale")).toBeVisible();
});

test("un solver risolve una sfida e appare nella classifica", async ({ page }) => {
  await signUp(page);
  const challenge = await createChallenge(page);

  await signOut(page);
  const solver = await signUp(page, {
    ...makeUser(),
    username: `aaa${Date.now().toString().slice(-8)}`,
  });
  await openChallenge(page, challenge);
  await sendAttempt(page, challenge.secretRegex);
  await expect(page.getByText("Hai gia risolto questa sfida al tentativo 1.")).toBeVisible();

  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: "Migliori solver" })).toBeVisible();
  await expect(page.getByText(`@${solver.username}`)).toBeVisible();
});
