"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { login, register } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import type { LoginPayload, RegisterPayload } from "@/entities/auth/model/types";
import type { ApiErrorPayload, ApiFieldError, ApiValidationError } from "@/shared/api/fetch-json";
import { isApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { sanitizeUserFacingMessage } from "@/shared/lib/user-facing-error";
import { sanitizeInternalNextUrl } from "@/shared/lib/safe-url";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { resetViewerSessionCache } from "./viewer-session-cache";

type AuthMode = "login" | "register";

const authFallbackMessages: Record<AuthMode, string> = {
  login: "Не удалось войти. Проверьте email и пароль и попробуйте ещё раз.",
  register: "Не удалось создать аккаунт. Проверьте данные и попробуйте ещё раз.",
};
const passwordRulesText = "Минимум 8 символов. Подтверждение должно совпадать с паролем.";
const authErrorCodeMessages: Record<string, { field: string; message: string }> = {
  email_invalid: { field: "Email", message: "Введите корректный email." },
  password_too_short: { field: "Password", message: "Пароль должен быть не короче 8 символов." },
  email_already_exists: { field: "Email", message: "Email уже занят." },
  user_already_exists: { field: "Email", message: "Email уже занят." },
  password_mismatch: { field: "ConfirmPassword", message: "Пароли не совпадают." },
  passwords_do_not_match: { field: "ConfirmPassword", message: "Пароли не совпадают." },
};

function getMode(searchParams: URLSearchParams): AuthMode {
  return searchParams.get("mode") === "register" ? "register" : "login";
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const mode = getMode(new URLSearchParams(searchParams));
  const nextUrl = sanitizeInternalNextUrl(searchParams.get("next"), routes.write);
  const [values, setValues] = useState<RegisterPayload>({
    email: "",
    password: "",
    confirm_password: "",
  });
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      await resetViewerSessionCache(queryClient);
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
      const validationMap = extractAuthFieldErrors(payload);

      setFieldErrors(validationMap);
      setGeneralError(Object.keys(validationMap).length ? "" : getAuthErrorMessage(error, mode));
    },
  });

  const pageCopy = useMemo(
    () =>
      mode === "register"
        ? {
            title: "Создать аккаунт",
            description: "Создайте аккаунт, чтобы сохранять понравившиеся истории и работать над своими сюжетами.",
            submitLabel: "Зарегистрироваться",
            switchLabel: "Уже есть аккаунт?",
            switchHref: routes.auth({ next: nextUrl }),
            switchCta: "Войти",
          }
        : {
            title: "Войти в Plotty",
            description: "Войдите, чтобы сохранять понравившиеся истории и работать над своими сюжетами.",
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

  function handleSubmit() {
    const validationMap = validateAuthValues(values, mode);

    if (Object.keys(validationMap).length) {
      setFieldErrors(validationMap);
      setGeneralError("");
      return;
    }

    setFieldErrors({});
    setGeneralError("");
    authMutation.mutate();
  }

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return (
    <PlottyPageShell showBottomNav={false} desktopHeaderActions={null} contentClassName="py-4 lg:py-7" suppressPageIntro>
      <div data-auth-intro="auth-form" className="plotty-motion-tab-panel mx-auto max-w-[32rem]">
      <PlottySectionCard className="space-y-6 p-5 sm:p-6">
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

          <PasswordField
            id="auth-password"
            label="Пароль"
            value={values.password}
            onChange={(value) => setValues((current) => ({ ...current, password: value }))}
            placeholder="Минимум 8 символов"
            error={fieldErrors.Password}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
            showLabel="Показать пароль"
            hideLabel="Скрыть пароль"
            hint={mode === "register" ? passwordRulesText : undefined}
          />

          {mode === "register" ? (
            <PasswordField
              id="auth-confirm-password"
              label="Подтверждение пароля"
              value={values.confirm_password}
              onChange={(value) => setValues((current) => ({ ...current, confirm_password: value }))}
              placeholder="Повторите пароль"
              error={fieldErrors.ConfirmPassword}
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword((current) => !current)}
              showLabel="Показать подтверждение пароля"
              hideLabel="Скрыть подтверждение пароля"
            />
          ) : null}

          {generalError ? (
            <div className="rounded-[18px] border border-[var(--plotty-accent-soft)] bg-[var(--plotty-accent-soft)] px-4 py-3 text-sm text-[var(--plotty-ink)]">
              {generalError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={authMutation.isPending} onClick={handleSubmit}>
              {authMutation.isPending ? "Отправляем..." : pageCopy.submitLabel}
            </Button>
          </div>
        </div>

        <p className="plotty-meta text-sm">
          {pageCopy.switchLabel}{" "}
          <Link href={pageCopy.switchHref} prefetch={false} className="font-semibold text-[var(--plotty-accent)]">
            {pageCopy.switchCta}
          </Link>
        </p>
      </PlottySectionCard>
      </div>
    </PlottyPageShell>
  );
}

function PasswordField({
  error,
  hideLabel,
  hint,
  id,
  label,
  onChange,
  onTogglePassword,
  placeholder,
  showLabel,
  showPassword,
  value,
}: {
  error?: string;
  hideLabel: string;
  hint?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onTogglePassword: () => void;
  placeholder: string;
  showLabel: string;
  showPassword: boolean;
  value: string;
}) {
  const toggleLabel = showPassword ? hideLabel : showLabel;

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pr-12"
        />
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={onTogglePassword}
          className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[var(--plotty-radius-sm)] text-[var(--plotty-muted)] transition-[background-color,color,transform] hover:bg-[var(--plotty-hover)] hover:text-[var(--plotty-ink)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        >
          {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function validateAuthValues(values: RegisterPayload, mode: AuthMode) {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.Email = "Введите email.";
  }

  if (!values.password) {
    errors.Password = "Введите пароль.";
  }

  if (mode === "register" && values.password && values.password.length < 8) {
    errors.Password = "Пароль должен быть не короче 8 символов.";
  }

  if (mode === "register" && values.password !== values.confirm_password) {
    errors.ConfirmPassword = "Пароли не совпадают.";
  }

  return errors;
}

function extractAuthFieldErrors(payload?: ApiErrorPayload) {
  const rawErrors = [...extractPayloadFieldErrors(payload?.errors), ...extractDetailFieldErrors(payload?.detail)];

  return rawErrors.reduce<Record<string, string>>((acc, item: Partial<ApiFieldError>) => {
    const mappedCodeError = item.code ? authErrorCodeMessages[normalizeAuthErrorCode(item.code)] : undefined;
    const fieldKey = normalizeAuthFieldKey(item.field ?? mappedCodeError?.field);
    const message = mappedCodeError?.message ?? (item.message ? translateAuthValidationMessage(item.message, fieldKey) : "");

    if (fieldKey && message) {
      acc[fieldKey] = message;
    }

    return acc;
  }, {});
}

function extractPayloadFieldErrors(errors?: ApiValidationError[]) {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.flatMap<Partial<ApiFieldError>>((item) => {
    if (typeof item === "string") {
      return [{ code: item }];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const field = typeof record.field === "string" ? record.field : undefined;
    const message =
      typeof record.message === "string" ? record.message : typeof record.msg === "string" ? record.msg : undefined;
    const code = typeof record.code === "string" ? record.code : undefined;

    return field || message || code ? [{ code, field, message }] : [];
  });
}

function extractDetailFieldErrors(detail: unknown): ApiFieldError[] {
  if (!Array.isArray(detail)) {
    return [];
  }

  return detail.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const loc = Array.isArray(record.loc) ? record.loc : [];
    const field = [...loc].reverse().find((part) => typeof part === "string");
    const message = typeof record.msg === "string" ? record.msg : typeof record.message === "string" ? record.message : "";

    return typeof field === "string" && message ? [{ field, message }] : [];
  });
}

function normalizeAuthFieldKey(field?: string) {
  if (!field) {
    return "";
  }

  const normalized = field.replace(/[\s_-]/g, "").toLowerCase();

  if (normalized === "email") {
    return "Email";
  }

  if (normalized === "password") {
    return "Password";
  }

  if (normalized === "confirmpassword" || normalized === "passwordconfirmation") {
    return "ConfirmPassword";
  }

  return field;
}

function normalizeAuthErrorCode(code: string) {
  return code.trim().toLowerCase().replace(/[\s-]/g, "_");
}

function translateAuthValidationMessage(message: string, fieldKey?: string) {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("password") && normalized.includes("match")) {
    return "Пароли не совпадают.";
  }

  if (normalized.includes("at least") || normalized.includes("minimum") || normalized.includes("8")) {
    return fieldKey === "Password" ? "Пароль должен быть не короче 8 символов." : message;
  }

  if (normalized.includes("already") && normalized.includes("exist")) {
    return fieldKey === "Email" ? "Email уже занят" : "Пользователь уже существует.";
  }

  if (normalized.includes("invalid") && normalized.includes("email")) {
    return "Введите корректный email.";
  }

  return sanitizeUserFacingMessage(message, message);
}

function getAuthErrorMessage(error: { message: string; status: number }, mode: AuthMode) {
  const message = error.message.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid email") || normalized.includes("invalid password")) {
    return "Неверный email или пароль.";
  }

  if (normalized.includes("already") && normalized.includes("exist")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }

  if (normalized.includes("password") && normalized.includes("match")) {
    return "Пароли не совпадают.";
  }

  if (/^request failed:/i.test(message) || [400, 409, 422].includes(error.status)) {
    return authFallbackMessages[mode];
  }

  return sanitizeUserFacingMessage(message, authFallbackMessages[mode]);
}
