import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAttempt,
  createChallenge,
  getChallenge,
  getLeaderboard,
  listChallenges,
  listMyAttempts,
} from "./api";
import type { ChallengeOrdering } from "./types";

export const challengesQueryKey = (page: number, ordering: ChallengeOrdering) =>
  ["challenges", page, ordering] as const;
export const challengeQueryKey = (challengeId: string) => ["challenges", challengeId] as const;
export const challengeAttemptsQueryKey = (challengeId: string) =>
  ["challenges", challengeId, "attempts", "me"] as const;
export const leaderboardQueryKey = (page: number) => ["leaderboard", page] as const;

export function useChallenges(page = 1, ordering: ChallengeOrdering = "newest") {
  return useQuery({
    queryKey: challengesQueryKey(page, ordering),
    queryFn: () => listChallenges(page, ordering),
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useChallenge(challengeId: string) {
  return useQuery({
    queryKey: challengeQueryKey(challengeId),
    queryFn: () => getChallenge(challengeId),
    enabled: challengeId.length > 0,
  });
}

export function useMyChallengeAttempts(challengeId: string) {
  return useQuery({
    queryKey: challengeAttemptsQueryKey(challengeId),
    queryFn: () => listMyAttempts(challengeId),
    enabled: challengeId.length > 0,
  });
}

export function useCreateAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttempt,
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({
        queryKey: challengeAttemptsQueryKey(String(attempt.challengeId)),
      });
      if (attempt.solved) {
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      }
    },
  });
}

export function useLeaderboard(page = 1) {
  return useQuery({
    queryKey: leaderboardQueryKey(page),
    queryFn: () => getLeaderboard(page),
  });
}
