import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAttempt,
  createChallenge,
  getChallenge,
  getLeaderboard,
  listChallenges,
  listMyAttempts,
} from "./api";

export const challengesQueryKey = ["challenges"] as const;
export const challengeQueryKey = (challengeId: number) => ["challenges", challengeId] as const;
export const challengeAttemptsQueryKey = (challengeId: number) =>
  ["challenges", challengeId, "attempts", "me"] as const;
export const leaderboardQueryKey = ["leaderboard"] as const;

export function useChallenges() {
  return useQuery({
    queryKey: challengesQueryKey,
    queryFn: listChallenges,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengesQueryKey });
    },
  });
}

export function useChallenge(challengeId: number) {
  return useQuery({
    queryKey: challengeQueryKey(challengeId),
    queryFn: () => getChallenge(challengeId),
    enabled: Number.isFinite(challengeId) && challengeId > 0,
  });
}

export function useMyChallengeAttempts(challengeId: number) {
  return useQuery({
    queryKey: challengeAttemptsQueryKey(challengeId),
    queryFn: () => listMyAttempts(challengeId),
    enabled: Number.isFinite(challengeId) && challengeId > 0,
  });
}

export function useCreateAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttempt,
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({
        queryKey: challengeAttemptsQueryKey(attempt.challengeId),
      });
      if (attempt.solved) {
        queryClient.invalidateQueries({ queryKey: leaderboardQueryKey });
      }
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: getLeaderboard,
  });
}
