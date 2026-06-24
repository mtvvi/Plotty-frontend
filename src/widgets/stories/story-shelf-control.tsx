"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ChevronDown, Plus } from "lucide-react";
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

type ReaderShelfTone = "neutral" | "success" | "info" | "danger" | "gold" | "accent";

const readerShelfToneByShelf: Record<ReaderShelf, ReaderShelfTone> = {
  reading: "success",
  planned: "info",
  dropped: "danger",
  read: "gold",
  favorite: "accent",
};

export function StoryShelfControl({
  storyId,
  className,
  compact = false,
  initialShelf = null,
  loadOnMount = false,
}: {
  storyId: string;
  className?: string;
  compact?: boolean;
  initialShelf?: ReaderShelf | "" | null;
  loadOnMount?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const popover = usePopover();
  const [localShelf, setLocalShelf] = useState<ReaderShelf | "" | null>(initialShelf);
  const shouldLoadShelf = loadOnMount || popover.open;
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: isAuthenticated && shouldLoadShelf }));
  const currentShelf = useMemo(
    () => shelfQuery.data?.items.find((entry) => entry.storyId === storyId)?.shelf ?? localShelf ?? "",
    [localShelf, shelfQuery.data?.items, storyId],
  );
  const shelfMutation = useMutation({
    mutationFn: (nextShelf: ReaderShelf | "") =>
      nextShelf ? setStoryShelf(storyId, nextShelf) : removeStoryShelf(storyId),
    onMutate: (nextShelf) => {
      const previousShelf = currentShelf;

      setLocalShelf(nextShelf);

      return { previousShelf };
    },
    onSuccess: async () => {
      popover.close();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
        queryClient.invalidateQueries({ queryKey: storyKeys.all }),
      ]);
    },
    onError: (error, _nextShelf, context) => {
      setLocalShelf(context?.previousShelf ?? initialShelf ?? "");

      if (isAuthError(error)) {
        router.push(routes.auth({ next: buildNextUrl(pathname, new URLSearchParams(searchParams)) }));
      }
    },
  });

  useEffect(() => {
    setLocalShelf(initialShelf ?? null);
  }, [initialShelf, storyId]);

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
    if (!ensureAuthenticated()) {
      return;
    }

    if (localShelf === null && !shelfQuery.data) {
      popover.toggle();
      return;
    }

    if (!currentShelf) {
      setShelf("planned");
      return;
    }

    popover.toggle();
  }

  function handleSecondaryClick() {
    if (!currentShelf && !popover.open) {
      handlePrimaryClick();
      return;
    }

    if (ensureAuthenticated()) {
      popover.toggle();
    }
  }

  const label = currentShelf ? readerShelfLabels[currentShelf] : "В планы";
  const currentTone = currentShelf ? readerShelfToneByShelf[currentShelf] : "neutral";
  const busy = shelfMutation.isPending || (isAuthenticated && shouldLoadShelf && shelfQuery.isLoading);
  const showQuickAddIcon = !currentShelf && !popover.open;

  return (
    <div ref={popover.triggerRef} className={cn("relative w-full min-w-0", compact ? "" : "max-w-[18rem] space-y-1.5", className)}>
      {compact ? null : <span className="plotty-kicker">Статус</span>}
      <div
        data-reader-shelf-tone={currentTone}
        className={cn(
          "plotty-reader-shelf-tone grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] overflow-hidden rounded-[16px] border shadow-[0_8px_24px_rgba(46,35,23,0.05)] transition-[border-color,box-shadow,transform] duration-[var(--motion-base)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(58,43,27,0.08)]",
        )}
      >
        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={busy}
          title={currentShelf ? `Статус: ${label}` : "Добавить историю в планы"}
          data-reader-shelf-tone={currentTone}
          className={cn(
            "plotty-button-label min-h-[42px] min-w-0 text-left text-current disabled:opacity-60",
            compact ? "flex items-center gap-2 overflow-hidden px-3" : "truncate px-3 transition-colors hover:bg-[var(--plotty-hover)]",
          )}
        >
          {compact ? <Bookmark className="size-4 shrink-0" aria-hidden="true" /> : null}
          <span className="truncate">{label}</span>
        </button>
        <button
          type="button"
          aria-label={showQuickAddIcon ? "Добавить историю в планы" : "Выбрать статус"}
          aria-haspopup={showQuickAddIcon ? undefined : "listbox"}
          aria-expanded={showQuickAddIcon ? undefined : popover.open}
          title={showQuickAddIcon ? "Добавить историю в планы" : "Выбрать статус"}
          onClick={handleSecondaryClick}
          disabled={busy}
          data-reader-shelf-tone={currentTone}
          className="flex min-h-[42px] items-center justify-center border-l border-[var(--plotty-line)] text-current transition-colors hover:bg-[var(--plotty-hover)] disabled:opacity-60"
        >
          {showQuickAddIcon ? (
            <Plus className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className={cn("size-4 transition-transform duration-[var(--motion-base)]", popover.open && "rotate-180")} aria-hidden="true" />
          )}
        </button>
      </div>

      <PopoverContent
        open={popover.open}
        contentRef={popover.contentRef}
        position={popover.position}
        role="listbox"
        aria-label="Статус чтения"
        className="space-y-1.5 rounded-[16px] p-2"
      >
        {readerShelfOptions.map((option) => {
          const optionTone = readerShelfToneByShelf[option.value];

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={currentShelf === option.value}
              data-reader-shelf-tone={optionTone}
              onClick={() => setShelf(option.value)}
              className="plotty-popover-item plotty-button-label plotty-reader-shelf-menu-item flex min-h-[42px] w-full items-center rounded-[16px] border px-3 text-left transition-[background-color,border-color,color,box-shadow]"
            >
              {option.label}
            </button>
          );
        })}
        {currentShelf ? (
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => setShelf("")}
            className="plotty-popover-item mt-1.5 flex w-full items-center rounded-[12px] border border-[var(--plotty-line)] px-3 py-2.5 text-left text-sm text-[var(--plotty-muted)] transition-colors hover:border-[var(--plotty-line-strong)] hover:text-[var(--plotty-ink)]"
          >
            Убрать статус
          </button>
        ) : null}
      </PopoverContent>
    </div>
  );
}
