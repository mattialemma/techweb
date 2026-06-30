import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPersonalAttemptLog,
  fetchPuzzle,
  fetchPuzzleCatalog,
  fetchSolverBoard,
  publishPuzzle,
  submitPuzzleAttempt,
} from "./api";
import type { PuzzleOrdering } from "./types";

export function usePuzzleCatalog(page = 1, ordering: PuzzleOrdering = "newest") {
  return useQuery({
    queryKey: puzzleCatalogKey(page, ordering),
    queryFn: () => fetchPuzzleCatalog(page, ordering),
  });
}

export function usePublishPuzzle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishPuzzle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puzzles"] });
    },
  });
}

export function usePuzzle(challengeId: string) {
  return useQuery({
    queryKey: puzzleDetailKey(challengeId),
    queryFn: () => fetchPuzzle(challengeId),
    enabled: challengeId.length > 0,
  });
}

export function usePersonalAttemptLog(challengeId: string) {
  return useQuery({
    queryKey: personalAttemptLogKey(challengeId),
    queryFn: () => fetchPersonalAttemptLog(challengeId),
    enabled: challengeId.length > 0,
  });
}

export function useSubmitPuzzleAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPuzzleAttempt,
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({
        queryKey: personalAttemptLogKey(String(attempt.challengeId)),
      });
      if (attempt.solved) {
        queryClient.invalidateQueries({ queryKey: ["solver-board"] });
      }
    },
  });
}

export function useSolverBoard(page = 1) {
  return useQuery({
    queryKey: solverBoardKey(page),
    queryFn: () => fetchSolverBoard(page),
  });
}

export function puzzleCatalogKey(page: number, ordering: PuzzleOrdering) {
  return ["puzzles", page, ordering] as const;
}

export function puzzleDetailKey(challengeId: string) {
  return ["puzzles", challengeId] as const;
}

export function personalAttemptLogKey(challengeId: string) {
  return ["challenges", challengeId, "attempts", "me"] as const;
}

export function solverBoardKey(page: number) {
  return ["solver-board", page] as const;
}
