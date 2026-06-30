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

export async function fetchPuzzleCatalog(
  page = 1,
  ordering: PuzzleOrdering = "newest",
): Promise<PaginatedResponse<Challenge>> {
  const { data } = await apiClient.get<PaginatedResponse<Challenge>>("/challenges", {
    params: { ordering, page },
  });
  return data;
}

export async function publishPuzzle(payload: CreateChallengePayload): Promise<Challenge> {
  const { data } = await apiClient.post<Challenge>("/challenges", payload);
  return data;
}

export async function fetchPuzzle(challengeId: string): Promise<Challenge> {
  const { data } = await apiClient.get<Challenge>(`/challenges/${challengeId}`);
  return data;
}

export async function submitPuzzleAttempt(payload: CreateAttemptPayload): Promise<Attempt> {
  const { data } = await apiClient.post<Attempt>(`/challenges/${payload.challengeId}/attempts`, {
    proposedRegex: payload.proposedRegex,
  });
  return data;
}

export async function fetchPersonalAttemptLog(challengeId: string): Promise<Attempt[]> {
  const { data } = await apiClient.get<PaginatedResponse<Attempt>>(
    `/challenges/${challengeId}/attempts/me`,
  );
  return data.results;
}

export async function fetchSolverBoard(page = 1): Promise<PaginatedResponse<LeaderboardEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<LeaderboardEntry>>("/leaderboard", {
    params: { page },
  });
  return data;
}
