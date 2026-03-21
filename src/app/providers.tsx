"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { initializeMocks } from "@/mocks/browser";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";

let browserMocksPromise: Promise<void> | null = null;

function ensureMocks() {
  if (!browserMocksPromise) {
    browserMocksPromise = initializeMocks();
  }

  return browserMocksPromise;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [isReady, setIsReady] = useState(process.env.NEXT_PUBLIC_API_MOCKING !== "enabled");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") {
      setIsReady(true);
      return;
    }

    ensureMocks()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isReady ? children : <AppShellSkeleton />}
    </QueryClientProvider>
  );
}
