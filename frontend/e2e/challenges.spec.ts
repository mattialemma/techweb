// File: challenges.spec.ts
// Scopo: Copre nel browser i percorsi di creazione e soluzione delle sfide.
// Livello: Suite test E2E
// Esporta: test Playwright
// Dipende da: helpers.ts e dallo stack frontend/backend in esecuzione

import { expect, test } from "@playwright/test";

import {
  createUniqueChallenge,
  createUniqueUser,
  fillChallengeForm,
  logoutUser,
  openChallengeDetail,
  publishChallenge,
  registerUser,
  submitAttempt,
} from "./helpers";

test("un utente autenticato puo creare una nuova sfida", async ({ page }) => {
  await registerUser(page);

  const challenge = await publishChallenge(page);
  const challengeCard = page.getByRole("link", { name: new RegExp(`Apri sfida ${challenge.title}`) });

  await expect(challengeCard.getByText(challenge.description)).toBeVisible();
  await expect(challengeCard.getByText(`passa${challenge.positiveExample}`)).toBeVisible();
  await expect(challengeCard.getByText(`stop${challenge.negativeExample}`)).toBeVisible();
});

test("la creazione sfida segnala errore se l'esempio positivo non rispetta la regex", async ({ page }) => {
  await registerUser(page);

  const challenge = { ...createUniqueChallenge(), positiveExample: "abc" };
  await page.goto("/challenges/new");
  await fillChallengeForm(page, challenge);
  await page.getByRole("button", { name: "Pubblica sfida" }).click();

  await expect(page).toHaveURL(/\/challenges\/new/);
  await expect(page.getByText("L'esempio positivo deve soddisfare la regex.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepara una sfida" })).toBeVisible();
});

test("l'autore puo vedere la propria sfida ma non puo inviare tentativi", async ({ page }) => {
  await registerUser(page);
  const challenge = await publishChallenge(page);

  await openChallengeDetail(page, challenge);

  await expect(page.getByText("Sei l'autore della sfida")).toBeVisible();
  await expect(page.getByRole("button", { name: "Verifica regex" })).toBeHidden();
});

test("un secondo utente puo inviare un tentativo parziale su una sfida", async ({ page }) => {
  await registerUser(page);
  const challenge = await publishChallenge(page);

  await logoutUser(page);
  await registerUser(page);
  await openChallengeDetail(page, challenge);

  await submitAttempt(page, "[A-Z]+");

  await expect(page.getByText("Feedback:")).toBeVisible();
  await expect(page.getByText("Tentativo 1")).toBeVisible();
  await expect(page.getByText("Parziale")).toBeVisible();
  await expect(page.getByText("[A-Z]+")).toBeVisible();
});

test("un secondo utente puo risolvere una sfida con la regex corretta", async ({ page }) => {
  await registerUser(page);
  const challenge = await publishChallenge(page);

  await logoutUser(page);
  await registerUser(page);
  await openChallengeDetail(page, challenge);
  await submitAttempt(page, challenge.secretRegex);

  await expect(page.getByText("Hai gia risolto questa sfida al tentativo 1.")).toBeVisible();
  await expect(page.getByText("Tentativo 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Risolta")).toBeVisible();
  await expect(page.getByText(challenge.secretRegex)).toBeVisible();
});

test("un utente che risolve una sfida compare nel podio", async ({ page }) => {
  await registerUser(page);
  const challenge = await publishChallenge(page);

  await logoutUser(page);
  const solver = await registerUser(page, {
    ...createUniqueUser(),
    username: `aaa${Date.now().toString().slice(-8)}`,
  });
  await openChallengeDetail(page, challenge);
  await submitAttempt(page, challenge.secretRegex);
  await page.goto("/leaderboard");

  await expect(page.getByRole("heading", { name: "Migliori risolutori" })).toBeVisible();
  await expect(page.getByText(`@${solver.username}`)).toBeVisible();
  await expect(page.getByText("1").first()).toBeVisible();
});
