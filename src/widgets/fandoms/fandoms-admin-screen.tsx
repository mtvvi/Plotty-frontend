"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveFandom,
  fandomKeys,
  pendingFandomsQueryOptions,
  rejectFandom,
} from "@/entities/fandom/api/fandom-api";
import type { SuggestedFandom } from "@/entities/fandom/model/types";
import { useAuth } from "@/entities/auth/model/auth-context";
import { storyKeys } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";
import { toUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Surface } from "@/shared/ui/card";
import { PlottyPageShell } from "@/widgets/layout/plotty-page-shell";

function formatFandomDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function FandomMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="plotty-kicker">{label}</div>
      <div className="text-sm font-semibold text-[var(--plotty-ink)]">{value}</div>
    </div>
  );
}

function PendingFandomCard({
  fandom,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
}: {
  fandom: SuggestedFandom;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Surface variant="default" className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="plotty-section-title">{fandom.name}</h2>
            <Badge tone="gold">На модерации</Badge>
          </div>
          <p className="plotty-body whitespace-pre-wrap text-[var(--plotty-muted)]">{fandom.description}</p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[var(--plotty-line)] pt-4 sm:grid-cols-3">
        <FandomMeta label="Автор заявки" value={`#${fandom.userId}`} />
        <FandomMeta label="Создана" value={formatFandomDate(fandom.createdAt)} />
        <FandomMeta label="Обновлена" value={formatFandomDate(fandom.updatedAt)} />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--plotty-line)] pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onReject(fandom.id)}
          disabled={isApproving || isRejecting}
          isLoading={isRejecting}
        >
          <X className="size-4" aria-hidden="true" />
          Отклонить
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => onApprove(fandom.id)}
          disabled={isApproving || isRejecting}
          isLoading={isApproving}
        >
          <Check className="size-4" aria-hidden="true" />
          Одобрить
        </Button>
      </div>
    </Surface>
  );
}

export function FandomsAdminScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [actionError, setActionError] = useState("");
  const isAdmin = Boolean(user?.isAdmin);
  const pendingQuery = useQuery(pendingFandomsQueryOptions({ enabled: isAdmin }));
  const approveMutation = useMutation({ mutationFn: approveFandom });
  const rejectMutation = useMutation({ mutationFn: rejectFandom });

  async function refreshFandomData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fandomKeys.all }),
      queryClient.invalidateQueries({ queryKey: storyKeys.tags() }),
    ]);
  }

  async function handleApprove(fandomId: string) {
    setActionError("");

    try {
      await approveMutation.mutateAsync(fandomId);
      await refreshFandomData();
    } catch (error) {
      setActionError(toUserFacingErrorMessage(error, "Не удалось одобрить фандом"));
    }
  }

  async function handleReject(fandomId: string) {
    setActionError("");

    try {
      await rejectMutation.mutateAsync(fandomId);
      await refreshFandomData();
    } catch (error) {
      setActionError(toUserFacingErrorMessage(error, "Не удалось отклонить фандом"));
    }
  }

  if (isLoading) {
    return (
      <PlottyPageShell pageTitle="Модерация фандомов" pageDescription="Заявки авторов на новые каноны.">
        <div className="grid gap-4">
          <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/40" />
          <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/40" />
        </div>
      </PlottyPageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <PlottyPageShell pageTitle="Модерация фандомов" pageDescription="Заявки авторов на новые каноны.">
        <EmptyState
          title="Нужен вход"
          description="Войдите в аккаунт администратора, чтобы модерировать фандомы."
          actionLabel="Войти"
          onAction={() => router.push(routes.auth({ next: routes.fandoms }))}
        />
      </PlottyPageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PlottyPageShell pageTitle="Модерация фандомов" pageDescription="Заявки авторов на новые каноны.">
        <EmptyState
          title="Нет доступа"
          description="Этот раздел доступен только администраторам."
          actionLabel="Вернуться в каталог"
          onAction={() => router.push(routes.home)}
        />
      </PlottyPageShell>
    );
  }

  return (
    <PlottyPageShell
      pageTitle="Модерация фандомов"
      pageDescription="Одобрение создаёт новый тег-фандом и запускает генерацию базы канона на backend."
      pageMeta={
        <Chip tone="blue">
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          Админ
        </Chip>
      }
    >
      <div className="space-y-4">
        {actionError ? (
          <Surface variant="subtle" className="p-4 text-sm font-semibold text-[var(--plotty-accent)]" role="alert">
            {actionError}
          </Surface>
        ) : null}

        {pendingQuery.isLoading ? (
          <div className="grid gap-4">
            <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/40" />
            <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/40" />
          </div>
        ) : pendingQuery.isError ? (
          <EmptyState title="Не удалось загрузить заявки" description="Проверьте доступ администратора и попробуйте обновить страницу." />
        ) : pendingQuery.data?.items.length ? (
          <div className="grid gap-4">
            {pendingQuery.data.items.map((fandom) => (
              <PendingFandomCard
                key={fandom.id}
                fandom={fandom}
                isApproving={approveMutation.isPending && approveMutation.variables === fandom.id}
                isRejecting={rejectMutation.isPending && rejectMutation.variables === fandom.id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Новых заявок нет" description="Когда авторы предложат фандомы, они появятся здесь." />
        )}
      </div>
    </PlottyPageShell>
  );
}
