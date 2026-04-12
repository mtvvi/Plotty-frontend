"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { authKeys, logout, updateProfile } from "@/entities/auth/api/auth-api";
import type { AuthUser } from "@/entities/auth/model/types";
import { useAuth } from "@/entities/auth/model/auth-context";
import { ApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { usernameValidationMessage } from "@/shared/lib/username";
import { cn } from "@/shared/lib/utils";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function AccountMenuBody({
  user,
  profileEditExpanded,
  onEditClick,
  onCancelEdit,
  usernameDraft,
  onUsernameDraftChange,
  onSaveUsername,
  updatePending,
  clientUsernameError,
  serverError,
  logoutPending,
  onLogout,
}: {
  user: AuthUser;
  profileEditExpanded: boolean;
  onEditClick: () => void;
  onCancelEdit: () => void;
  usernameDraft: string;
  onUsernameDraftChange: (value: string) => void;
  onSaveUsername: (event: FormEvent) => void;
  updatePending: boolean;
  clientUsernameError: string | null;
  serverError: string | null;
  logoutPending: boolean;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/84 p-4">
        <div className="text-sm font-semibold text-[var(--plotty-ink)]">{user.username}</div>
        <div className="mt-1 text-xs text-[var(--plotty-muted)]">{user.email}</div>
      </div>

      {profileEditExpanded ? (
        <form className="mt-3 space-y-3" onSubmit={onSaveUsername}>
          <Field>
            <FieldLabel htmlFor="account-menu-username">Ник</FieldLabel>
            <Input
              id="account-menu-username"
              name="username"
              autoComplete="username"
              value={usernameDraft}
              onChange={(event) => onUsernameDraftChange(event.target.value)}
              disabled={updatePending}
              aria-invalid={Boolean(clientUsernameError)}
            />
            <FieldHint>Латиница, цифры и «_», от 3 до 40 символов.</FieldHint>
          </Field>
          {clientUsernameError ? <FieldError>{clientUsernameError}</FieldError> : null}
          {!clientUsernameError && serverError ? <FieldError>{serverError}</FieldError> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" className="min-h-10 px-4 text-sm" disabled={updatePending || Boolean(clientUsernameError)}>
              {updatePending ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button type="button" variant="secondary" className="min-h-10 px-4 text-sm" disabled={updatePending} onClick={onCancelEdit}>
              Отмена
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 grid gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-[16px] px-3 text-sm"
            disabled={logoutPending}
            onClick={onEditClick}
          >
            Редактировать
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-[16px] px-3 text-sm"
            disabled={logoutPending}
            onClick={onLogout}
          >
            {logoutPending ? "Выходим..." : "Выйти"}
          </Button>
        </div>
      )}
    </>
  );
}

export function AuthStatus({ variant = "full" }: { variant?: "full" | "compact" | "menu" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileEditExpanded, setProfileEditExpanded] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      setProfileEditExpanded(false);
      setAccountMenuOpen(false);
      router.refresh();
    },
  });

  useEffect(() => {
    if (!accountMenuOpen) {
      setProfileEditExpanded(false);
    }
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAccountMenuOpen(false);
      setProfileEditExpanded(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!accountMenuOpen || variant === "menu") {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen, variant]);

  function handleStartProfileEdit() {
    if (!user) {
      return;
    }

    setUsernameDraft(user.username);
    updateProfileMutation.reset();
    setProfileEditExpanded(true);
  }

  function handleCancelProfileEdit() {
    setProfileEditExpanded(false);
    updateProfileMutation.reset();
  }

  function handleSaveUsername(event: FormEvent) {
    event.preventDefault();

    if (usernameValidationMessage(usernameDraft)) {
      return;
    }

    updateProfileMutation.mutate({ username: usernameDraft.trim() });
  }

  const clientUsernameError = usernameValidationMessage(usernameDraft);
  const serverError = updateProfileMutation.error instanceof ApiError ? updateProfileMutation.error.message : null;

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

  const accountPanelClass =
    "absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(18rem,calc(100vw-2rem))] rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-3 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl";

  const triggerButtonClass = cn(
    "inline-flex min-h-[54px] items-center justify-start gap-3 rounded-full border border-[rgba(41,38,34,0.08)] bg-white/84 px-2.5 py-1.5 pr-4 text-left shadow-[0_8px_24px_rgba(46,35,23,0.08)] transition-[background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
    accountMenuOpen ? "bg-white shadow-[0_12px_28px_rgba(46,35,23,0.1)]" : "hover:bg-white",
  );

  if (variant === "compact" || variant === "full") {
    return (
      <div ref={accountMenuRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
          onClick={() => setAccountMenuOpen((current) => !current)}
          className={triggerButtonClass}
        >
          <span className="flex size-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.12)] text-sm font-bold text-[var(--plotty-accent)]">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 text-left leading-none">
            <span className="block max-w-[8rem] truncate text-[0.95rem] font-semibold text-[var(--plotty-ink)]">{user.username}</span>
            <span className="mt-1 hidden max-w-[8rem] truncate text-[11px] text-[var(--plotty-muted)] md:block">{user.email}</span>
          </span>
          <span className="ml-0.5 text-[var(--plotty-muted)]" aria-hidden="true">
            ▾
          </span>
        </button>

        {accountMenuOpen ? (
          <div role="menu" className={accountPanelClass}>
            <AccountMenuBody
              user={user}
              profileEditExpanded={profileEditExpanded}
              onEditClick={handleStartProfileEdit}
              onCancelEdit={handleCancelProfileEdit}
              usernameDraft={usernameDraft}
              onUsernameDraftChange={setUsernameDraft}
              onSaveUsername={handleSaveUsername}
              updatePending={updateProfileMutation.isPending}
              clientUsernameError={clientUsernameError}
              serverError={serverError}
              logoutPending={logoutMutation.isPending}
              onLogout={async () => {
                setAccountMenuOpen(false);
                await logoutMutation.mutateAsync();
                router.refresh();
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="plotty-kicker">Аккаунт</div>
      <AccountMenuBody
        user={user}
        profileEditExpanded={profileEditExpanded}
        onEditClick={handleStartProfileEdit}
        onCancelEdit={handleCancelProfileEdit}
        usernameDraft={usernameDraft}
        onUsernameDraftChange={setUsernameDraft}
        onSaveUsername={handleSaveUsername}
        updatePending={updateProfileMutation.isPending}
        clientUsernameError={clientUsernameError}
        serverError={serverError}
        logoutPending={logoutMutation.isPending}
        onLogout={async () => {
          await logoutMutation.mutateAsync();
          router.refresh();
        }}
      />
    </div>
  );
}
