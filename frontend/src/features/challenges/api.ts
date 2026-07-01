// File: api.ts
// Scopo: Raggruppa le chiamate HTTP per catalogo, dettaglio, tentativi e classifica.
// Livello: API feature
// Esporta: funzioni dati usate dagli hook challenges

import apiClient from "@shared/api/client";
import type {
  Attempt,
  Challenge,
  CreateAttemptPayload,
  CreateChallengePayload,
  LeaderboardEntry,
  PaginatedResponse,
  PuzzleOrdering,
} from "./types";

const challengeRoutes = {
  attemptsFor: (challengeId: string) => `/challenges/${challengeId}/attempts`,
  catalog: "/challenges",
  detail: (challengeId: string) => `/challenges/${challengeId}`,
  leaderboard: "/leaderboard",
  myAttemptsFor: (challengeId: string) => `/challenges/${challengeId}/attempts/me`,
} as const;

export async function readPuzzleDetail(challengeId: string): Promise<Challenge> {
  const { data: puzzle } = await apiClient.get<Challenge>(challengeRoutes.detail(challengeId));
  return puzzle;
}

export async function readPuzzleCatalog(
  pageNumber = 1,
  sortMode: PuzzleOrdering = "newest",
): Promise<PaginatedResponse<Challenge>> {
  const { data: catalog } = await apiClient.get<PaginatedResponse<Challenge>>(challengeRoutes.catalog, {
    params: { ordering: sortMode, page: pageNumber },
  });
  return catalog;
}

export async function createPuzzleFromDraft(draft: CreateChallengePayload): Promise<Challenge> {
  const { data: createdPuzzle } = await apiClient.post<Challenge>(challengeRoutes.catalog, draft);
  return createdPuzzle;
}

export async function readPersonalAttempts(challengeId: string): Promise<Attempt[]> {
  const { data: attemptPage } = await apiClient.get<PaginatedResponse<Attempt>>(
    challengeRoutes.myAttemptsFor(challengeId),
  );
  return attemptPage.results;
}

export async function createPuzzleAttempt(attemptDraft: CreateAttemptPayload): Promise<Attempt> {
  const { challengeId, proposedRegex } = attemptDraft;
  const { data: attempt } = await apiClient.post<Attempt>(challengeRoutes.attemptsFor(challengeId), {
    proposedRegex,
  });
  return attempt;
}

export async function readSolverBoard(pageNumber = 1): Promise<PaginatedResponse<LeaderboardEntry>> {
  const { data: board } = await apiClient.get<PaginatedResponse<LeaderboardEntry>>(
    challengeRoutes.leaderboard,
    {
      params: { page: pageNumber },
    },
  );
  return board;
}
