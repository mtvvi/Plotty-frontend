"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { authKeys, logout } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { storyKeys } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, ButtonLink } from "@/shared/ui/button";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function AccountAvatar({
  username,
  avatarUrl,
  className,
}: {
  username: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={`Аватар ${username}`} className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.12)] font-bold text-[var(--plotty-accent)]", className)}>
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
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
      queryClient.removeQueries({ queryKey: storyKeys.all });
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

  const avatarUrl = user.avatarUrl ?? user.avatar_url ?? null;

  if (variant === "menu") {
    return (
      <div className="space-y-3.5">
        <div className="plotty-kicker">Аккаунт</div>
        <Link
          href={routes.user(user.username)}
          className="flex items-center gap-3 rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/84 p-4 transition-colors hover:bg-white"
        >
          <AccountAvatar username={user.username} avatarUrl={avatarUrl} className="size-11 text-sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--plotty-ink)]">{user.username}</span>
            <span className="mt-1 block truncate text-xs text-[var(--plotty-muted)]">{user.email}</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-[16px] px-3 text-sm"
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
    <Link
      href={routes.user(user.username)}
      className="inline-flex min-h-[54px] items-center justify-start gap-3 rounded-full border border-[rgba(41,38,34,0.08)] bg-white/84 px-2.5 py-1.5 pr-4 text-left shadow-[0_8px_24px_rgba(46,35,23,0.08)] transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
      aria-label={`Открыть профиль ${user.username}`}
    >
      <AccountAvatar username={user.username} avatarUrl={avatarUrl} className="size-[2.75rem] text-sm" />
      <span className="min-w-0 text-left leading-none">
        <span className="block max-w-[8rem] truncate text-[0.95rem] font-semibold text-[var(--plotty-ink)]">{user.username}</span>
        <span className="mt-1 hidden max-w-[8rem] truncate text-[11px] text-[var(--plotty-muted)] md:block">{user.email}</span>
      </span>
      <span className="ml-0.5 text-[var(--plotty-muted)]" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
