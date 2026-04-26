"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  addStoryToCollection,
  createCollection,
  libraryKeys,
  myCollectionDetailsQueryOptions,
  removeStoryFromCollection,
} from "@/entities/library/api/library-api";
import { profileKeys } from "@/entities/profile/api/profile-api";
import { ApiError, isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PopoverContent, usePopover } from "@/shared/ui/popover";
import { Textarea } from "@/shared/ui/textarea";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function StoryCollectionControl({
  storyId,
  className,
  compact = false,
}: {
  storyId: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const popover = usePopover({ minWidth: 320 });
  const [createOpen, setCreateOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const collectionsQuery = useQuery(myCollectionDetailsQueryOptions({ enabled: isAuthenticated }));
  const collections = useMemo(() => collectionsQuery.data ?? [], [collectionsQuery.data]);
  const containingCollections = useMemo(
    () => collections.filter((collection) => collection.stories.some((story) => story.id === storyId)),
    [collections, storyId],
  );
  const selectedCount = containingCollections.length;
  const membershipMutation = useMutation({
    mutationFn: ({ collectionId, selected }: { collectionId: string; selected: boolean }) =>
      selected ? removeStoryFromCollection(collectionId, storyId) : addStoryToCollection(collectionId, storyId),
    onSuccess: invalidateCollections,
    onError: handleMutationError,
  });
  const createMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const collection = await createCollection({ title, description });
      await addStoryToCollection(collection.id, storyId);

      return collection;
    },
    onSuccess: async () => {
      setTitleDraft("");
      setDescriptionDraft("");
      setCreateOpen(false);
      await invalidateCollections();
    },
    onError: handleMutationError,
  });

  async function invalidateCollections() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: libraryKeys.collections() }),
      queryClient.invalidateQueries({ queryKey: libraryKeys.collectionDetails() }),
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
    ]);
  }

  function handleMutationError(error: unknown) {
    if (isAuthError(error)) {
      router.push(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
      return;
    }

    setLocalError(error instanceof ApiError ? error.message : "Не удалось обновить подборку");
  }

  function ensureAuthenticated() {
    if (isAuthenticated) {
      return true;
    }

    router.push(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
    return false;
  }

  function handleToggleOpen() {
    if (!ensureAuthenticated()) {
      return;
    }

    setLocalError(null);
    popover.toggle();
  }

  function handleToggleCollection(collectionId: string, selected: boolean) {
    setLocalError(null);
    membershipMutation.mutate({ collectionId, selected });
  }

  function handleCreateCollection(event: FormEvent) {
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
    createMutation.mutate({ title, description: descriptionDraft });
  }

  const busy = membershipMutation.isPending || createMutation.isPending || (isAuthenticated && collectionsQuery.isLoading);
  const label = selectedCount ? `В ${selectedCount} подборк${selectedCount === 1 ? "е" : "ах"}` : "Добавить в подборку";

  return (
    <div ref={popover.triggerRef} className={cn("relative w-full min-w-0", compact ? "" : "max-w-[18rem] space-y-1.5", className)}>
      {compact ? null : <span className="plotty-kicker">Подборки</span>}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] overflow-hidden rounded-[16px] border border-[rgba(41,38,34,0.1)] bg-white/88 shadow-[0_8px_24px_rgba(46,35,23,0.05)]">
        <button
          type="button"
          className="plotty-button-label flex min-h-[42px] min-w-0 items-center gap-2 overflow-hidden px-3 text-left text-[var(--plotty-ink)] disabled:opacity-60"
          onClick={handleToggleOpen}
          disabled={busy}
        >
          {compact ? <Layers className="size-4 shrink-0" aria-hidden="true" /> : null}
          <span className="truncate">{label}</span>
        </button>
        <button
          type="button"
          aria-label="Выбрать подборку"
          aria-haspopup="dialog"
          aria-expanded={popover.open}
          onClick={handleToggleOpen}
          disabled={busy}
          className="flex min-h-[42px] items-center justify-center border-l border-[rgba(41,38,34,0.1)] text-[var(--plotty-muted)] transition-colors hover:bg-white disabled:opacity-60"
        >
          ▾
        </button>
      </div>

      <PopoverContent
        open={popover.open}
        contentRef={popover.contentRef}
        position={popover.position}
        role="dialog"
        aria-label="Подборки"
        className="max-h-[min(34rem,calc(100vh-2rem))] overflow-y-auto rounded-[18px] p-3"
      >
          {collectionsQuery.isLoading ? (
            <div className="plotty-meta">Загружаем подборки...</div>
          ) : collections.length ? (
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {collections.map((collection) => {
                const selected = collection.stories.some((story) => story.id === storyId);

                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => handleToggleCollection(collection.id, selected)}
                    disabled={busy}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-60",
                      selected ? "bg-white font-semibold text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
                    )}
                  >
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border border-[rgba(41,38,34,0.18)] text-[10px]">
                      {selected ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{collection.title}</span>
                      <span className="plotty-meta block">{collection.stories.length} историй</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="plotty-meta">У вас пока нет подборок.</div>
          )}

          {createOpen ? (
            <form className="space-y-3 border-t border-[rgba(41,38,34,0.08)] pt-3" onSubmit={handleCreateCollection}>
              <Field>
                <FieldLabel htmlFor={`collection-title-${storyId}`}>Название</FieldLabel>
                <Input
                  id={`collection-title-${storyId}`}
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  maxLength={200}
                  disabled={createMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`collection-description-${storyId}`}>Описание</FieldLabel>
                <Textarea
                  id={`collection-description-${storyId}`}
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  maxLength={5000}
                  className="min-h-24"
                  disabled={createMutation.isPending}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" className="min-h-10 px-3 text-sm" disabled={createMutation.isPending}>
                  Создать
                </Button>
                <Button type="button" variant="ghost" className="min-h-10 px-3 text-sm" onClick={() => setCreateOpen(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-10 justify-start px-3 text-sm"
              onClick={() => {
                setLocalError(null);
                setCreateOpen(true);
              }}
            >
              + Новая подборка
            </Button>
          )}

          {localError ? <FieldError>{localError}</FieldError> : null}
      </PopoverContent>
    </div>
  );
}
