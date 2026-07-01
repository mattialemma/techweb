import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClient } from "@shared/api";
import { AuthProvider } from "@features/auth";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {children} </AuthProvider>
    </QueryClientProvider>
  );
}
