"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { logout, authKeys } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function AuthStatus({ variant = "full" }: { variant?: "full" | "compact" | "menu" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });

  if (isLoading) {
    return <span className="text-sm text-[var(--plotty-muted)]">Проверяем сессию...</span>;
  }

  if (!isAuthenticated || !user) {
    const nextUrl = buildNextUrl(pathname, new URLSearchParams(searchParams));

    if (variant === "compact") {
      return (
        <ButtonLink href={routes.auth({ next: nextUrl })} variant="secondary" className="h-10 px-3 text-sm">
          Войти
        </ButtonLink>
      );
    }

    if (variant === "menu") {
      return (
        <div className="grid gap-2">
          <ButtonLink href={routes.auth({ next: nextUrl })} variant="secondary" className="w-full">
            Войти
          </ButtonLink>
          <ButtonLink href={routes.auth({ mode: "register", next: nextUrl })} variant="primary" className="w-full">
            Регистрация
          </ButtonLink>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={routes.auth({ next: nextUrl })} variant="secondary">
          Войти
        </ButtonLink>
        <ButtonLink href={routes.auth({ mode: "register", next: nextUrl })} variant="primary">
          Регистрация
        </ButtonLink>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold">{user.username}</div>
        </div>
        <Button
          variant="secondary"
          className="h-10 px-3 text-sm"
          disabled={logoutMutation.isPending}
          onClick={async () => {
            await logoutMutation.mutateAsync();
            router.refresh();
          }}
        >
          {logoutMutation.isPending ? "..." : "Выйти"}
        </Button>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className="space-y-3">
        <div className="rounded-[18px] border border-[var(--plotty-line)] bg-white/80 p-4">
          <div className="text-sm font-semibold">{user.username}</div>
          <div className="mt-1 text-xs text-[var(--plotty-muted)]">{user.email}</div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          disabled={logoutMutation.isPending}
          onClick={async () => {
            await logoutMutation.mutateAsync();
            router.refresh();
          }}
        >
          {logoutMutation.isPending ? "Выходим..." : "Выйти"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-semibold">{user.username}</div>
        <div className="text-xs text-[var(--plotty-muted)]">{user.email}</div>
      </div>
      <Button
        variant="secondary"
        disabled={logoutMutation.isPending}
        onClick={async () => {
          await logoutMutation.mutateAsync();
          router.refresh();
        }}
      >
        {logoutMutation.isPending ? "Выходим..." : "Выйти"}
      </Button>
    </div>
  );
}
