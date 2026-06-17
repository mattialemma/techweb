import apiClient from "@shared/api/client";
import type {
  Attempt,
  Challenge,
  CreateAttemptPayload,
  CreateChallengePayload,
  LeaderboardEntry,
} from "./types";

export async function listChallenges(): Promise<Challenge[]> {
  const { data } = await apiClient.get<Challenge[]>("/challenges");
  return data;
}

export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data } = await apiClient.post<Challenge>("/challenges", payload);
  return data;
}

export async function getChallenge(challengeId: number): Promise<Challenge> {
  const { data } = await apiClient.get<Challenge>(`/challenges/${challengeId}`);
  return data;
}

export async function createAttempt(payload: CreateAttemptPayload): Promise<Attempt> {
  const { data } = await apiClient.post<Attempt>(`/challenges/${payload.challengeId}/attempts`, {
    proposedRegex: payload.proposedRegex,
  });
  return data;
}

export async function listMyAttempts(challengeId: number): Promise<Attempt[]> {
  const { data } = await apiClient.get<Attempt[]>(`/challenges/${challengeId}/attempts/me`);
  return data;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntry[]>("/leaderboard");
  return data;
}
