// File: hooks.ts
// Scopo: Collega API challenges a React Query con chiavi cache stabili.
// Livello: Hook feature
// Esporta: hook dati e factory delle query key

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPuzzleAttempt,
  createPuzzleFromDraft,
  readPersonalAttempts,
  readPuzzleCatalog,
  readPuzzleDetail,
  readSolverBoard,
} from "./api";
import type { PuzzleOrdering } from "./types";

const puzzleRootKey = "puzzles";
const solverBoardRootKey = "solver-board";

export function puzzleCatalogKey(pageNumber: number, sortMode: PuzzleOrdering) {
  return [puzzleRootKey, pageNumber, sortMode] as const;
}

export function puzzleDetailKey(challengeId: string) {
  return [puzzleRootKey, challengeId] as const;
}

export function personalAttemptLogKey(challengeId: string) {
  return ["challenges", challengeId, "attempts", "me"] as const;
}

export function solverBoardKey(pageNumber: number) {
  return [solverBoardRootKey, pageNumber] as const;
}

export function usePuzzleCatalog(pageNumber = 1, sortMode: PuzzleOrdering = "newest") {
  return useQuery({
    queryKey: puzzleCatalogKey(pageNumber, sortMode),
    queryFn: () => readPuzzleCatalog(pageNumber, sortMode),
  });
}

export function usePuzzle(challengeId: string) {
  const canLoadPuzzle = challengeId.length > 0;

  return useQuery({
    queryKey: puzzleDetailKey(challengeId),
    queryFn: () => readPuzzleDetail(challengeId),
    enabled: canLoadPuzzle,
  });
}

export function useSubmitPuzzleAttempt() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: createPuzzleAttempt,
    onSuccess: (savedAttempt) => {
      cache.invalidateQueries({
        queryKey: personalAttemptLogKey(String(savedAttempt.challengeId)),
      });
      if (savedAttempt.solved) {
        cache.invalidateQueries({ queryKey: [solverBoardRootKey] });
      }
    },
  });
}

export function usePersonalAttemptLog(challengeId: string) {
  const canLoadAttempts = challengeId.length > 0;

  return useQuery({
    queryKey: personalAttemptLogKey(challengeId),
    queryFn: () => readPersonalAttempts(challengeId),
    enabled: canLoadAttempts,
  });
}

export function usePublishPuzzle() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: createPuzzleFromDraft,
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: [puzzleRootKey] });
    },
  });
}

export function useSolverBoard(pageNumber = 1) {
  return useQuery({
    queryKey: solverBoardKey(pageNumber),
    queryFn: () => readSolverBoard(pageNumber),
  });
}
