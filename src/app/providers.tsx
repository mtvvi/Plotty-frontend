"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { initializeMocks } from "@/mocks/browser";
import { ThemeProvider } from "@/shared/theme/theme-context";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StoryRevealProvider } from "@/shared/ui/story-reveal-transition";

let browserMocksPromise: Promise<void> | null = null;

export function shouldInitializeBrowserMocks({
  apiMocking = process.env.NEXT_PUBLIC_API_MOCKING,
  nodeEnv = process.env.NODE_ENV,
}: {
  apiMocking?: string;
  nodeEnv?: string;
} = {}) {
  return apiMocking === "enabled" && nodeEnv !== "production";
}

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
  const [isReady, setIsReady] = useState(!shouldInitializeBrowserMocks());

  useEffect(() => {
    if (!shouldInitializeBrowserMocks()) {
      setIsReady(true);
      return;
    }

    ensureMocks()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true));
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {isReady ? (
          <AuthProvider>
            <StoryRevealProvider>{children}</StoryRevealProvider>
          </AuthProvider>
        ) : (
          <AppShellSkeleton />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
