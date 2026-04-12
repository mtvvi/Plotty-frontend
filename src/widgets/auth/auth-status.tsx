"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { logout, authKeys } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, ButtonLink } from "@/shared/ui/button";

import { ProfileEditDialog } from "./profile-edit-dialog";

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
  const [isCompactMenuOpen, setIsCompactMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const compactMenuRef = useRef<HTMLDivElement | null>(null);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });

  useEffect(() => {
    if (!isCompactMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!compactMenuRef.current?.contains(event.target as Node)) {
        setIsCompactMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCompactMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCompactMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileOpen(false);
    }
  }, [isAuthenticated]);

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
      <>
        <div ref={compactMenuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isCompactMenuOpen}
            onClick={() => setIsCompactMenuOpen((current) => !current)}
            className={cn(
              "inline-flex min-h-[54px] items-center justify-start gap-3 rounded-full border border-[rgba(41,38,34,0.08)] bg-white/84 px-2.5 py-1.5 pr-4 text-left shadow-[0_8px_24px_rgba(46,35,23,0.08)] transition-[background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
              isCompactMenuOpen ? "bg-white shadow-[0_12px_28px_rgba(46,35,23,0.1)]" : "hover:bg-white",
            )}
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL из профиля пользователя
              <img
                src={user.avatar_url}
                alt=""
                className="size-[2.75rem] shrink-0 rounded-full border border-[rgba(41,38,34,0.08)] object-cover"
              />
            ) : (
              <span className="flex size-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.12)] text-sm font-bold text-[var(--plotty-accent)]">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          <span className="min-w-0 text-left leading-none">
            <span className="block max-w-[8rem] truncate text-[0.95rem] font-semibold text-[var(--plotty-ink)]">
              {user.username}
            </span>
            <span className="mt-1 hidden max-w-[8rem] truncate text-[11px] text-[var(--plotty-muted)] md:block">{user.email}</span>
          </span>
          <span className="ml-0.5 text-[var(--plotty-muted)]" aria-hidden="true">
            ▾
          </span>
        </button>

        {isCompactMenuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[18rem] rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-3 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl"
          >
            <div className="rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/84 p-4">
              <div className="text-sm font-semibold text-[var(--plotty-ink)]">{user.username}</div>
              <div className="mt-1 text-xs text-[var(--plotty-muted)]">{user.email}</div>
            </div>
            <div className="mt-3 grid gap-2">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-[16px] px-3 text-sm"
                disabled={logoutMutation.isPending}
                onClick={() => {
                  setIsCompactMenuOpen(false);
                  setProfileOpen(true);
                }}
              >
                Редактировать
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-[16px] px-3 text-sm"
                disabled={logoutMutation.isPending}
                onClick={async () => {
                  setIsCompactMenuOpen(false);
                  await logoutMutation.mutateAsync();
                  router.refresh();
                }}
              >
                {logoutMutation.isPending ? "Выходим..." : "Выйти"}
              </Button>
            </div>
          </div>
        ) : null}
        </div>
        <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
      </>
    );
  }

  if (variant === "menu") {
    return (
      <>
        <div className="space-y-3.5">
          <div className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/84 p-4">
            <div className="plotty-kicker">Аккаунт</div>
            <div className="text-sm font-semibold">{user.username}</div>
            <div className="mt-1 text-xs text-[var(--plotty-muted)]">{user.email}</div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled={logoutMutation.isPending}
            onClick={() => setProfileOpen(true)}
          >
            Редактировать
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled={logoutMutation.isPending}
            onClick={async () => {
              await logoutMutation.mutateAsync();
              router.refresh();
            }}
          >
            {logoutMutation.isPending ? "Выходим..." : "Выйти"}
          </Button>
        </div>
        <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold">{user.username}</div>
          <div className="text-xs text-[var(--plotty-muted)]">{user.email}</div>
        </div>
        <Button variant="secondary" disabled={logoutMutation.isPending} onClick={() => setProfileOpen(true)}>
          Редактировать
        </Button>
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
      <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
