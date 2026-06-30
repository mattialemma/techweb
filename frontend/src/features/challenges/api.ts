import apiClient from "@shared/api/client";
import type {
  Attempt,
  Challenge,
  CreateAttemptPayload,
  CreateChallengePayload,
  LeaderboardEntry,
  PaginatedResponse,
} from "./types";

export async function listChallenges(page = 1): Promise<PaginatedResponse<Challenge>> {
  const { data } = await apiClient.get<PaginatedResponse<Challenge>>("/challenges", {
    params: { page },
  });
  return data;
}

export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data } = await apiClient.post<Challenge>("/challenges", payload);
  return data;
}

export async function getChallenge(challengeId: string): Promise<Challenge> {
  const { data } = await apiClient.get<Challenge>(`/challenges/${challengeId}`);
  return data;
}

export async function createAttempt(payload: CreateAttemptPayload): Promise<Attempt> {
  const { data } = await apiClient.post<Attempt>(`/challenges/${payload.challengeId}/attempts`, {
    proposedRegex: payload.proposedRegex,
  });
  return data;
}

export async function listMyAttempts(challengeId: string): Promise<Attempt[]> {
  const { data } = await apiClient.get<PaginatedResponse<Attempt>>(
    `/challenges/${challengeId}/attempts/me`,
  );
  return data.results;
}

export async function getLeaderboard(page = 1): Promise<PaginatedResponse<LeaderboardEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<LeaderboardEntry>>("/leaderboard", {
    params: { page },
  });
  return data;
}
