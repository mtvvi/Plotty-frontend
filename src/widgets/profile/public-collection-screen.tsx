"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import { deleteCollection, libraryKeys, myShelfQueryOptions, removeStoryFromCollection, updateCollection } from "@/entities/library/api/library-api";
import { profileKeys, publicUserCollectionQueryOptions } from "@/entities/profile/api/profile-api";
import { routes } from "@/shared/config/routes";
import { toUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { AnimatedList } from "@/shared/ui/motion";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";

import { CollectionLinkIcon } from "./profile-icons";

export function PublicCollectionScreen({
  username,
  collectionId,
}: {
  username: string;
  collectionId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const profileCollectionsHref = `${routes.user(username)}?tab=collections`;
  const collectionQuery = useQuery(publicUserCollectionQueryOptions(username, collectionId));
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: Boolean(user?.id) }));
  const shelfByStoryId = useMemo(
    () => new Map((shelfQuery.data?.items ?? []).map((entry) => [entry.storyId, entry.shelf])),
    [shelfQuery.data?.items],
  );
  const [editOpen, setEditOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const updateMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      updateCollection(collectionId, { title, description }),
    onSuccess: async () => {
      setEditOpen(false);
      await invalidateCollection();
    },
    onError: handleMutationError,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteCollection(collectionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.collections(username) }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.collections() }),
        queryClient.invalidateQueries({ queryKey: libraryKeys.collectionDetails() }),
      ]);
      router.push(profileCollectionsHref);
    },
    onError: handleMutationError,
  });
  const removeStoryMutation = useMutation({
    mutationFn: (storyId: string) => removeStoryFromCollection(collectionId, storyId),
    onSuccess: invalidateCollection,
    onError: handleMutationError,
  });

  async function invalidateCollection() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKeys.collection(username, collectionId) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.collections(username) }),
      queryClient.invalidateQueries({ queryKey: libraryKeys.collection(collectionId) }),
      queryClient.invalidateQueries({ queryKey: libraryKeys.collectionDetails() }),
    ]);
  }

  function handleMutationError(error: unknown) {
    setLocalError(toUserFacingErrorMessage(error, "Не удалось обновить подборку"));
  }

  if (collectionQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="Подборка загружается"
        pageDescription="Собираем список историй."
      >
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyPageShell>
    );
  }

  if (collectionQuery.isError || !collectionQuery.data) {
    return (
      <PlottyPageShell
        pageTitle="Подборка не найдена"
        pageDescription="Она могла быть удалена или принадлежит другому пользователю."
      >
        <EmptyState title="Подборка не найдена" description="Вернитесь в профиль пользователя и выберите другую подборку." />
      </PlottyPageShell>
    );
  }

  const collection = collectionQuery.data;
  const isOwner = Boolean(user?.id && collection.userId === user.id);

  function handleStartEdit() {
    setTitleDraft(collection.title);
    setDescriptionDraft(collection.description ?? "");
    setLocalError(null);
    setEditOpen(true);
  }

  function handleUpdate(event: FormEvent) {
    event.preventDefault();

    const title = titleDraft.trim();

    if (!title) {
      setLocalError("Введите название подборки");
      return;
    }

    if (title.length > 200) {
      setLocalError("Название не должно быть длиннее 200 символов");
      return;
    }

    if (descriptionDraft.trim().length > 5000) {
      setLocalError("Описание не должно быть длиннее 5000 символов");
      return;
    }

    setLocalError(null);
    updateMutation.mutate({ title, description: descriptionDraft });
  }

  async function handleCopyLink() {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.clipboard) {
      setLocalError("Не удалось скопировать ссылку");
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setLocalError(null);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setLocalError("Не удалось скопировать ссылку");
    }
  }

  function handleDeleteCollection() {
    setDeleteConfirmOpen(true);
  }

  function handleConfirmDeleteCollection() {
    deleteMutation.mutate(undefined, {
      onSettled: () => setDeleteConfirmOpen(false),
    });
  }

  return (
    <PlottyPageShell
      pageTitle={collection.title}
      pageDescription={collection.description ?? "Публичная подборка историй."}
      pageActions={
        <div className="flex flex-wrap items-center justify-end gap-3 lg:flex-nowrap">
          <ButtonLink href={profileCollectionsHref} variant="secondary" size="sm" className="whitespace-nowrap">
            К профилю
          </ButtonLink>
          <Button type="button" variant="secondary" size="sm" onClick={handleCopyLink}>
            <CollectionLinkIcon className="size-4" />
            {copied ? "Скопировано" : "Ссылка"}
          </Button>
          {isOwner ? (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={handleStartEdit}>
                Изменить
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteCollection} disabled={deleteMutation.isPending}>
                Удалить
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      {isOwner && editOpen ? (
        <div data-presence="collection-edit" className="plotty-motion-tab-panel">
          <PlottySectionCard className="mb-4">
            <form className="grid gap-4" onSubmit={handleUpdate}>
              <Field>
                <FieldLabel htmlFor="public-collection-title">Название</FieldLabel>
                <Input
                  id="public-collection-title"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  maxLength={200}
                  disabled={updateMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="public-collection-description">Описание</FieldLabel>
                <Textarea
                  id="public-collection-description"
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  maxLength={5000}
                  className="min-h-28"
                  disabled={updateMutation.isPending}
                />
              </Field>
              {localError ? <FieldError>{localError}</FieldError> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                  Сохранить
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} disabled={updateMutation.isPending}>
                  Отмена
                </Button>
              </div>
            </form>
          </PlottySectionCard>
        </div>
      ) : localError ? (
        <FieldError>{localError}</FieldError>
      ) : null}

      <PlottySectionCard
        title={`${collection.stories.length} ${getStoryLabel(collection.stories.length)}`}
        description={`Обновлена ${new Date(collection.updatedAt).toLocaleDateString("ru-RU")}`}
      >
        {collection.stories.length ? (
          <AnimatedList
            items={collection.stories}
            getKey={(story) => story.id}
            className="plotty-collection-story-list space-y-4"
            renderItem={(story) => (
              <div className="space-y-2">
                <StoryCard
                  story={story}
                  showChapterActions={false}
                  initialShelf={shelfByStoryId.get(story.id) ?? null}
                  initialCollectionIds={[collection.id]}
                />
                {isOwner ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-10 px-3 text-sm"
                      onClick={() => removeStoryMutation.mutate(story.id)}
                      disabled={removeStoryMutation.isPending}
                    >
                      Убрать из подборки
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          />
        ) : (
          <EmptyState title="В подборке пока нет историй" description="Автор подборки еще не добавил публичные работы." />
        )}
      </PlottySectionCard>
      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Удалить подборку?"
        description={`Подборка «${collection.title}» исчезнет из профиля, но сами истории останутся в каталоге.`}
        confirmLabel="Удалить подборку"
        isConfirming={deleteMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteCollection}
      />
    </PlottyPageShell>
  );
}

function getStoryLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "история";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "истории";
  }

  return "историй";
}
