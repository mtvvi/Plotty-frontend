"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { authKeys, login, register } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import type { LoginPayload, RegisterPayload } from "@/entities/auth/model/types";
import type { ApiFieldError } from "@/shared/api/fetch-json";
import { isApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

type AuthMode = "login" | "register";

function getMode(searchParams: URLSearchParams): AuthMode {
  return searchParams.get("mode") === "register" ? "register" : "login";
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const mode = getMode(new URLSearchParams(searchParams));
  const nextUrl = searchParams.get("next") || routes.write;
  const [values, setValues] = useState<RegisterPayload>({
    email: "",
    password: "",
    confirm_password: "",
  });
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const authMutation = useMutation({
    mutationFn: async () => {
      const payload: LoginPayload = {
        email: values.email.trim(),
        password: values.password,
      };

      return mode === "register" ? register({ ...payload, confirm_password: values.confirm_password }) : login(payload);
    },
    onSuccess: async () => {
      setGeneralError("");
      setFieldErrors({});
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      router.replace(nextUrl);
      router.refresh();
    },
    onError: (error) => {
      if (!isApiError(error)) {
        setGeneralError("Не удалось выполнить запрос. Попробуйте ещё раз.");
        setFieldErrors({});
        return;
      }

      const payload = typeof error.data === "object" && error.data ? error.data : undefined;
      const validationMap = (payload?.errors ?? []).reduce<Record<string, string>>((acc, item: ApiFieldError) => {
        acc[item.field] = item.message;
        return acc;
      }, {});

      setFieldErrors(validationMap);
      setGeneralError(payload?.error ?? error.message);
    },
  });

  const pageCopy = useMemo(
    () =>
      mode === "register"
        ? {
            title: "Создать аккаунт",
            description: "После регистрации вы сразу попадёте в авторскую зону и сможете продолжить работу.",
            submitLabel: "Зарегистрироваться",
            switchLabel: "Уже есть аккаунт?",
            switchHref: routes.auth({ next: nextUrl }),
            switchCta: "Войти",
          }
        : {
            title: "Войти в Plotty",
            description: "Авторские сценарии доступны только после входа в аккаунт.",
            submitLabel: "Войти",
            switchLabel: "Нет аккаунта?",
            switchHref: routes.auth({ mode: "register", next: nextUrl }),
            switchCta: "Создать",
          },
    [mode, nextUrl],
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isAuthenticated, isLoading, nextUrl, router]);

  function handleClose() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(routes.home);
  }

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return (
    <PlottyPageShell showBottomNav={false} desktopHeaderActions={null} contentClassName="py-4 lg:py-7" suppressPageIntro>
      <PlottySectionCard className="mx-auto max-w-[32rem] space-y-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="plotty-meta text-xs font-bold uppercase tracking-[0.14em]">
            {mode === "register" ? "Регистрация" : "Вход"}
          </span>
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={handleClose}>
            Назад
          </Button>
        </div>

        <div className="space-y-1.5">
          <h1 className="plotty-page-title text-[2rem] sm:text-[2.4rem]">{pageCopy.title}</h1>
          <p className="plotty-body text-[var(--plotty-muted)]">{pageCopy.description}</p>
        </div>

        <div className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="auth-email">Email</FieldLabel>
            <Input
              id="auth-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
            />
            {fieldErrors.Email ? <FieldError>{fieldErrors.Email}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="auth-password">Пароль</FieldLabel>
            <Input
              id="auth-password"
              type="password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              placeholder="Минимум 8 символов"
            />
            {fieldErrors.Password ? <FieldError>{fieldErrors.Password}</FieldError> : null}
          </Field>

          {mode === "register" ? (
            <Field>
              <FieldLabel htmlFor="auth-confirm-password">Подтверждение пароля</FieldLabel>
              <Input
                id="auth-confirm-password"
                type="password"
                value={values.confirm_password}
                onChange={(event) => setValues((current) => ({ ...current, confirm_password: event.target.value }))}
                placeholder="Повторите пароль"
              />
            </Field>
          ) : null}

          {generalError ? (
            <div className="rounded-[18px] border border-[var(--plotty-accent-soft)] bg-[var(--plotty-accent-soft)] px-4 py-3 text-sm text-[var(--plotty-ink)]">
              {generalError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={authMutation.isPending} onClick={() => authMutation.mutate()}>
              {authMutation.isPending ? "Отправляем..." : pageCopy.submitLabel}
            </Button>
          </div>
        </div>

        <p className="plotty-meta text-sm">
          {pageCopy.switchLabel}{" "}
          <Link href={pageCopy.switchHref} className="font-semibold text-[var(--plotty-accent)]">
            {pageCopy.switchCta}
          </Link>
        </p>
      </PlottySectionCard>
    </PlottyPageShell>
  );
}
