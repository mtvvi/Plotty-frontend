"use client";

import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import { deleteCollection, libraryKeys, removeStoryFromCollection, updateCollection } from "@/entities/library/api/library-api";
import { profileKeys, publicUserCollectionQueryOptions } from "@/entities/profile/api/profile-api";
import { ApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";

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
  const collectionQuery = useQuery(publicUserCollectionQueryOptions(username, collectionId));
  const [editOpen, setEditOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
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
      router.push(`${routes.user(username)}?tab=library`);
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
    setLocalError(error instanceof ApiError ? error.message : "Не удалось обновить подборку");
  }

  if (collectionQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="Подборка загружается"
        pageDescription="Собираем список историй."
        showMobileBack
        mobileBackHref={routes.user(username)}
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
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
        showMobileBack
        mobileBackHref={routes.user(username)}
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <EmptyState title="Подборка не найдена" description="Вернитесь в профиль пользователя и выберите другую подборку." />
      </PlottyPageShell>
    );
  }

  const collection = collectionQuery.data;
  const isOwner = Boolean(user?.username && user.username.toLowerCase() === username.trim().toLowerCase());

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
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <PlottyPageShell
      pageTitle={collection.title}
      pageDescription={collection.description ?? "Публичная подборка историй."}
      pageActions={
        <>
          <ButtonLink href={`${routes.user(username)}?tab=library`} variant="secondary">
            К профилю
          </ButtonLink>
          <Button type="button" variant="secondary" onClick={handleCopyLink}>
            {copied ? "Скопировано" : "Ссылка"}
          </Button>
          {isOwner ? (
            <>
              <Button type="button" variant="secondary" onClick={handleStartEdit}>
                Изменить
              </Button>
              <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                Удалить
              </Button>
            </>
          ) : null}
        </>
      }
      showMobileBack
      mobileBackHref={routes.user(username)}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      {isOwner && editOpen ? (
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
      ) : localError ? (
        <FieldError>{localError}</FieldError>
      ) : null}

      <PlottySectionCard
        title={`${collection.stories.length} ${getStoryLabel(collection.stories.length)}`}
        description={`Обновлена ${new Date(collection.updatedAt).toLocaleDateString("ru-RU")}`}
      >
        {collection.stories.length ? (
          <div className="space-y-4">
            {collection.stories.map((story) => (
              <div key={story.id} className="space-y-2">
                <StoryCard story={story} />
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
            ))}
          </div>
        ) : (
          <EmptyState title="В подборке пока нет историй" description="Автор подборки еще не добавил публичные работы." />
        )}
      </PlottySectionCard>
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
