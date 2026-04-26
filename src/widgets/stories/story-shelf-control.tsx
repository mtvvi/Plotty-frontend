"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  libraryKeys,
  myShelfQueryOptions,
  readerShelfLabels,
  readerShelfOptions,
  removeStoryShelf,
  setStoryShelf,
} from "@/entities/library/api/library-api";
import type { ReaderShelf } from "@/entities/library/model/types";
import { useAuth } from "@/entities/auth/model/auth-context";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { PopoverContent, usePopover } from "@/shared/ui/popover";
import { storyKeys } from "@/entities/story/api/stories-api";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function StoryShelfControl({
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
  const popover = usePopover();
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: isAuthenticated }));
  const currentShelf = useMemo(
    () => shelfQuery.data?.items.find((entry) => entry.storyId === storyId)?.shelf ?? "",
    [shelfQuery.data?.items, storyId],
  );
  const shelfMutation = useMutation({
    mutationFn: (nextShelf: ReaderShelf | "") =>
      nextShelf ? setStoryShelf(storyId, nextShelf) : removeStoryShelf(storyId),
    onSuccess: async () => {
      popover.close();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
        queryClient.invalidateQueries({ queryKey: storyKeys.all }),
      ]);
    },
    onError: (error) => {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
      }
    },
  });

  function ensureAuthenticated() {
    if (isAuthenticated) {
      return true;
    }

    router.push(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
    return false;
  }

  function setShelf(nextShelf: ReaderShelf | "") {
    if (!ensureAuthenticated()) {
      return;
    }

    shelfMutation.mutate(nextShelf);
  }

  function handlePrimaryClick() {
    if (!currentShelf) {
      setShelf("planned");
      return;
    }

    popover.toggle();
  }

  const label = currentShelf ? readerShelfLabels[currentShelf] : "Добавить в планы";
  const busy = shelfMutation.isPending || (isAuthenticated && shelfQuery.isLoading);

  return (
    <div ref={popover.triggerRef} className={cn("relative w-full min-w-0", compact ? "" : "max-w-[18rem] space-y-1.5", className)}>
      {compact ? null : <span className="plotty-kicker">Статус</span>}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] overflow-hidden rounded-[16px] border border-[rgba(41,38,34,0.1)] bg-white/88 shadow-[0_8px_24px_rgba(46,35,23,0.05)]">
        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={busy}
          className={cn(
            "plotty-button-label min-h-[42px] min-w-0 text-left text-[var(--plotty-ink)] disabled:opacity-60",
            compact ? "flex items-center gap-2 overflow-hidden px-3" : "truncate px-3 transition-colors hover:bg-white",
          )}
        >
          {compact ? <Bookmark className="size-4 shrink-0" aria-hidden="true" /> : !currentShelf ? <span className="mr-1 text-base leading-none">+</span> : null}
          <span className="truncate">{label}</span>
        </button>
        <button
          type="button"
          aria-label="Выбрать статус"
          aria-haspopup="listbox"
          aria-expanded={popover.open}
          onClick={() => {
            if (ensureAuthenticated()) {
              popover.toggle();
            }
          }}
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
        role="listbox"
        aria-label="Статус чтения"
        className="rounded-[16px] p-2"
      >
          {readerShelfOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={currentShelf === option.value}
              onClick={() => setShelf(option.value)}
              className={cn(
                "flex w-full items-center rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                currentShelf === option.value ? "bg-white font-semibold text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
              )}
            >
              {option.label}
            </button>
          ))}
          {currentShelf ? (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => setShelf("")}
              className="mt-1 flex w-full items-center rounded-[12px] border-t border-[rgba(41,38,34,0.08)] px-3 py-2.5 text-left text-sm text-[var(--plotty-muted)] transition-colors hover:bg-white/80"
            >
              Убрать статус
            </button>
          ) : null}
      </PopoverContent>
    </div>
  );
}
