"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    router.replace(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  if (isLoading || !isAuthenticated) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
}
