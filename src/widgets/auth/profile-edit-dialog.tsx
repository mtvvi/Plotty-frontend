"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys, updateProfile } from "@/entities/auth/api/auth-api";
import { useAuth } from "@/entities/auth/model/auth-context";
import { ApiError } from "@/shared/api/fetch-json";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

export function ProfileEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const titleId = useId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const profileFormBootstrappedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      onOpenChange(false);
      router.refresh();
    },
  });

  useEffect(() => {
    if (open && user) {
      if (!profileFormBootstrappedRef.current) {
        setUsername(user.username);
        setAvatarUrl(user.avatar_url ?? "");
        setAvatarBroken(false);
        mutation.reset();
      }

      profileFormBootstrappedRef.current = true;
    } else {
      profileFormBootstrappedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при открытии; mutation.reset стабилен
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open || !user) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextUsername = username.trim();

    if (!nextUsername) {
      return;
    }

    mutation.mutate({ username: nextUsername, avatarUrl: avatarUrl.trim() });
  }

  const serverMessage = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-[rgba(35,33,30,0.45)] backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-t-[28px] border border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-5 shadow-[var(--plotty-shadow)] backdrop-blur-xl sm:rounded-[24px] sm:p-6"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="plotty-section-title">
            Профиль
          </h2>
          <Button type="button" variant="secondary" className="h-10 shrink-0 px-3 text-sm" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex justify-center">
            {avatarUrl.trim() && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element -- произвольный URL с бэкенда
              <img
                src={avatarUrl.trim()}
                alt=""
                className="size-20 rounded-full border border-[rgba(41,38,34,0.1)] object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-[rgba(188,95,61,0.12)] text-2xl font-bold text-[var(--plotty-accent)]">
                {username.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
          </div>

          <Field>
            <FieldLabel htmlFor="profile-username">Ник</FieldLabel>
            <Input
              id="profile-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={mutation.isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-avatar-url">URL аватара</FieldLabel>
            <Input
              id="profile-avatar-url"
              name="avatarUrl"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              disabled={mutation.isPending}
            />
            <FieldHint>Оставьте пустым, чтобы убрать картинку.</FieldHint>
          </Field>

          {serverMessage ? <FieldError>{serverMessage}</FieldError> : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" variant="primary" disabled={mutation.isPending || !username.trim()}>
              {mutation.isPending ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
