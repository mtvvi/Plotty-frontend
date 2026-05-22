"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { logout } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { sanitizeImageUrl } from "@/shared/lib/safe-url";
import { Button, ButtonLink } from "@/shared/ui/button";
import { profileAvatarPlaceholderSrc } from "@/widgets/profile/profile-avatar-placeholder";

import { resetViewerSessionCache } from "./viewer-session-cache";

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
  const imageSrc = sanitizeImageUrl(avatarUrl) ?? profileAvatarPlaceholderSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt={`Аватар ${username}`} className={cn("shrink-0 rounded-[var(--plotty-radius-md)] object-cover transition-[box-shadow,transform] duration-[var(--motion-base)] group-hover:-translate-y-px group-hover:shadow-[0_10px_22px_rgba(58,43,27,0.12)]", className)} />
  );
}

export function AuthStatus({
  variant = "full",
  profileIndicatorRef,
  showInlineActiveIndicator = true,
}: {
  variant?: "full" | "compact" | "menu";
  profileIndicatorRef?: (node: HTMLAnchorElement | null) => void;
  showInlineActiveIndicator?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await resetViewerSessionCache(queryClient);
    },
  });

  if (isLoading) {
    return (
      <span
        data-auth-status-loading="true"
        className={cn(
          "inline-flex items-center text-sm text-[var(--plotty-muted)]",
          variant === "compact" ? "min-h-[86px] w-[13rem]" : "min-h-10",
        )}
      >
        Проверяем сессию...
      </span>
    );
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
  const profileHref = routes.user(user.username);
  const isProfileActive = pathname === profileHref || pathname.startsWith(`${profileHref}/`);

  if (variant === "menu") {
    return (
      <div className="space-y-3.5">
        <div className="plotty-kicker">Аккаунт</div>
        <Link
          href={profileHref}
          className="flex items-center gap-3 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[var(--plotty-surface)] p-4 transition-colors hover:bg-[var(--plotty-surface-hover)]"
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
      ref={profileIndicatorRef}
      href={profileHref}
      className={cn(
        "group plotty-button-label relative inline-flex min-h-[86px] items-center justify-start gap-3 rounded-[var(--plotty-radius-md)] px-2.5 py-1.5 pr-4 text-left text-[var(--plotty-ink)] transition-[color,transform] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] hover:text-[var(--plotty-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
        isProfileActive ? "text-[var(--plotty-accent)]" : null,
      )}
      aria-label={`Открыть профиль ${user.username}`}
      aria-current={isProfileActive ? "page" : undefined}
    >
      <AccountAvatar username={user.username} avatarUrl={avatarUrl} className="size-[2.75rem] text-sm" />
      <span className="min-w-0 text-left leading-normal">
        <span className="block max-w-[8rem] truncate text-[0.95rem] font-semibold leading-[1.2] text-[var(--plotty-ink)]">{user.username}</span>
        <span className="mt-1 hidden max-w-[8rem] truncate text-[11px] leading-[1.35] text-[var(--plotty-muted)] md:block">{user.email}</span>
      </span>
      <span className="ml-0.5 text-[var(--plotty-muted)] transition-transform duration-[var(--motion-base)] group-hover:translate-x-0.5" aria-hidden="true">
        →
      </span>
      {showInlineActiveIndicator && isProfileActive ? (
        <span
          className="absolute inset-x-2.5 bottom-0 h-0.5 bg-[var(--plotty-accent)]"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}
