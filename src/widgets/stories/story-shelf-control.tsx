"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
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
import { storyKeys } from "@/entities/story/api/stories-api";

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function StoryShelfControl({ storyId, className }: { storyId: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState({ left: 0, top: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const shelfQuery = useQuery(myShelfQueryOptions(null, { enabled: isAuthenticated }));
  const currentShelf = useMemo(
    () => shelfQuery.data?.items.find((entry) => entry.storyId === storyId)?.shelf ?? "",
    [shelfQuery.data?.items, storyId],
  );
  const shelfMutation = useMutation({
    mutationFn: (nextShelf: ReaderShelf | "") =>
      nextShelf ? setStoryShelf(storyId, nextShelf) : removeStoryShelf(storyId),
    onSuccess: async () => {
      setOpen(false);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function syncMenuPosition() {
      const rect = rootRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setMenuRect({
        left: rect.left,
        top: rect.bottom + 6,
        width: rect.width,
      });
    }

    syncMenuPosition();
    window.addEventListener("resize", syncMenuPosition);
    window.addEventListener("scroll", syncMenuPosition, true);

    return () => {
      window.removeEventListener("resize", syncMenuPosition);
      window.removeEventListener("scroll", syncMenuPosition, true);
    };
  }, [open]);

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

    setOpen((current) => !current);
  }

  const label = currentShelf ? readerShelfLabels[currentShelf] : "Добавить в планы";
  const busy = shelfMutation.isPending || (isAuthenticated && shelfQuery.isLoading);

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-[18rem] space-y-1.5", className)}>
      <span className="plotty-kicker">Статус</span>
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] overflow-hidden rounded-[16px] border border-[rgba(41,38,34,0.1)] bg-white/88 shadow-[0_8px_24px_rgba(46,35,23,0.05)]">
        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={busy}
          className="min-h-[42px] truncate px-3 text-left text-sm font-semibold text-[var(--plotty-ink)] transition-colors hover:bg-white disabled:opacity-60"
        >
          {!currentShelf ? <span className="mr-1 text-base leading-none">+</span> : null}
          {label}
        </button>
        <button
          type="button"
          aria-label="Выбрать статус"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (ensureAuthenticated()) {
              setOpen((current) => !current);
            }
          }}
          disabled={busy}
          className="flex min-h-[42px] items-center justify-center border-l border-[rgba(41,38,34,0.1)] text-[var(--plotty-muted)] transition-colors hover:bg-white disabled:opacity-60"
        >
          ▾
        </button>
      </div>

      {open && mounted ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Статус чтения"
          className="z-[100] rounded-[16px] border border-[rgba(41,38,34,0.1)] bg-[rgba(247,242,234,0.98)] p-2 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl"
          style={{
            position: "fixed",
            left: menuRect.left,
            top: menuRect.top,
            width: menuRect.width,
          }}
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
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
