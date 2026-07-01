// File: queryClient.ts
// Scopo: Crea il client React Query condiviso da tutta l'app.
// Livello: Configurazione API condivisa
// Esporta: queryClient

import { QueryClient } from "@tanstack/react-query";

const defaultQueryOptions = {
  queries: {
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});
