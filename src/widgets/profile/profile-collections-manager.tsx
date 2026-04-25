"use client";

import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCollection,
  deleteCollection,
  libraryKeys,
  myCollectionsQueryOptions,
  updateCollection,
} from "@/entities/library/api/library-api";
import { profileKeys } from "@/entities/profile/api/profile-api";
import type { UserCollectionSummary } from "@/entities/profile/model/types";
import { ApiError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function ProfileCollectionsManager({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const collectionsQuery = useQuery(myCollectionsQueryOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingCollection, setEditingCollection] = useState<UserCollectionSummary | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState("");
  const [editDescriptionDraft, setEditDescriptionDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const collections = collectionsQuery.data?.items ?? [];
  const createMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: async () => {
      setTitleDraft("");
      setDescriptionDraft("");
      setCreateOpen(false);
      await invalidateCollections();
    },
    onError: handleMutationError,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description: string }) =>
      updateCollection(id, { title, description }),
    onSuccess: async () => {
      setEditingCollection(null);
      await invalidateCollections();
    },
    onError: handleMutationError,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: invalidateCollections,
    onError: handleMutationError,
  });

  async function invalidateCollections() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: libraryKeys.collections() }),
      queryClient.invalidateQueries({ queryKey: libraryKeys.collectionDetails() }),
      queryClient.invalidateQueries({ queryKey: profileKeys.collections(username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
    ]);
  }

  function handleMutationError(error: unknown) {
    setLocalError(error instanceof ApiError ? error.message : "Не удалось обновить подборку");
  }

  function validate(title: string, description: string) {
    if (!title.trim()) {
      return "Введите название подборки";
    }

    if (title.trim().length > 200) {
      return "Название не должно быть длиннее 200 символов";
    }

    if (description.trim().length > 5000) {
      return "Описание не должно быть длиннее 5000 символов";
    }

    return null;
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();

    const error = validate(titleDraft, descriptionDraft);

    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(null);
    createMutation.mutate({ title: titleDraft.trim(), description: descriptionDraft });
  }

  function handleStartEdit(collection: UserCollectionSummary) {
    setEditingCollection(collection);
    setEditTitleDraft(collection.title);
    setEditDescriptionDraft(collection.description ?? "");
    setLocalError(null);
  }

  function handleUpdate(event: FormEvent) {
    event.preventDefault();

    if (!editingCollection) {
      return;
    }

    const error = validate(editTitleDraft, editDescriptionDraft);

    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(null);
    updateMutation.mutate({
      id: editingCollection.id,
      title: editTitleDraft.trim(),
      description: editDescriptionDraft,
    });
  }

  async function handleCopyLink(collectionId: string) {
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${routes.userCollection(username, collectionId)}`);
    setCopiedId(collectionId);
    window.setTimeout(() => setCopiedId((current) => (current === collectionId ? null : current)), 1800);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="plotty-section-title">Публичные подборки</div>
          <p className="plotty-meta">Соберите рекомендации и делитесь ссылкой из публичного профиля.</p>
        </div>
        <Button type="button" variant="primary" onClick={() => setCreateOpen((current) => !current)}>
          Новая подборка
        </Button>
      </div>

      {createOpen ? (
        <form className="grid gap-4 rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4" onSubmit={handleCreate}>
          <Field>
            <FieldLabel htmlFor="profile-collection-title">Название</FieldLabel>
            <Input
              id="profile-collection-title"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              maxLength={200}
              disabled={createMutation.isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-collection-description">Описание</FieldLabel>
            <Textarea
              id="profile-collection-description"
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              maxLength={5000}
              className="min-h-28"
              disabled={createMutation.isPending}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              Создать
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Отмена
            </Button>
          </div>
        </form>
      ) : null}

      {localError ? <FieldError>{localError}</FieldError> : null}

      {collectionsQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-36 rounded-[20px] bg-white/50" />
          <div className="h-36 rounded-[20px] bg-white/50" />
        </div>
      ) : collections.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {collections.map((collection) => {
            const isEditing = editingCollection?.id === collection.id;

            return (
              <div key={collection.id} className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4">
                {isEditing ? (
                  <form className="space-y-3" onSubmit={handleUpdate}>
                    <Field>
                      <FieldLabel htmlFor={`edit-collection-title-${collection.id}`}>Название</FieldLabel>
                      <Input
                        id={`edit-collection-title-${collection.id}`}
                        value={editTitleDraft}
                        onChange={(event) => setEditTitleDraft(event.target.value)}
                        maxLength={200}
                        disabled={updateMutation.isPending}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`edit-collection-description-${collection.id}`}>Описание</FieldLabel>
                      <Textarea
                        id={`edit-collection-description-${collection.id}`}
                        value={editDescriptionDraft}
                        onChange={(event) => setEditDescriptionDraft(event.target.value)}
                        maxLength={5000}
                        className="min-h-24"
                        disabled={updateMutation.isPending}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="primary" className="min-h-10 px-3 text-sm" disabled={updateMutation.isPending}>
                        Сохранить
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-10 px-3 text-sm"
                        onClick={() => setEditingCollection(null)}
                        disabled={updateMutation.isPending}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="plotty-card-title text-[1.15rem]">{collection.title}</div>
                      {collection.description ? (
                        <p className="plotty-body line-clamp-3 text-sm leading-6 text-[var(--plotty-muted)]">
                          {collection.description}
                        </p>
                      ) : (
                        <p className="plotty-meta">Описание не заполнено.</p>
                      )}
                      <div className="plotty-meta">{collection.storiesCount} историй</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink href={routes.userCollection(username, collection.id)} variant="secondary" className="min-h-10 px-3 text-sm">
                        Открыть
                      </ButtonLink>
                      <Button type="button" variant="secondary" className="min-h-10 px-3 text-sm" onClick={() => handleCopyLink(collection.id)}>
                        {copiedId === collection.id ? "Скопировано" : "Ссылка"}
                      </Button>
                      <Button type="button" variant="ghost" className="min-h-10 px-3 text-sm" onClick={() => handleStartEdit(collection)}>
                        Изменить
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="min-h-10 px-3 text-sm"
                        onClick={() => deleteMutation.mutate(collection.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Подборок пока нет" description="Создайте первую подборку и добавляйте туда фанфики из каталога или страницы истории." />
      )}
    </div>
  );
}
