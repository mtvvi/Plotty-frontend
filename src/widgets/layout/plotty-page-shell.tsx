"use client";

import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Feather,
  Library,
  PenLine,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Card, type SurfaceVariant } from "@/shared/ui/card";
import { iconButtonClassName, IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Sheet } from "@/shared/ui/sheet";
import { AuthStatus } from "@/widgets/auth/auth-status";

export const plottyPrimaryNavItems = [
  { href: routes.home, label: "Каталог" },
  { href: routes.write, label: "Мастерская" },
] as const;

function isPrimaryNavItemActive(pathname: string, href: string) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildNextUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function useOptionalSearchParams() {
  try {
    return useSearchParams();
  } catch {
    return new URLSearchParams();
  }
}

export function PlottyPageShell({
  children,
  pageTitle,
  pageDescription,
  pageMeta,
  pageActions,
  desktopHeaderActions,
  mobileHeaderActions,
  mobileToolbar,
  showMobileBack = false,
  mobileBackHref,
  contentClassName,
  showBottomNav = true,
  menuContent,
  onMenuOpenChange,
  suppressPageIntro = false,
  className,
}: {
  children: ReactNode;
  pageTitle?: ReactNode;
  pageDescription?: string;
  pageMeta?: ReactNode;
  pageActions?: ReactNode;
  desktopHeaderActions?: ReactNode;
  mobileHeaderActions?: ReactNode;
  mobileToolbar?: ReactNode;
  showMobileBack?: boolean;
  mobileBackHref?: string;
  contentClassName?: string;
  showBottomNav?: boolean;
  menuContent?: (options: { closeMenu: () => void }) => ReactNode;
  onMenuOpenChange?: (open: boolean) => void;
  suppressPageIntro?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    onMenuOpenChange?.(isMobileMenuOpen);
  }, [isMobileMenuOpen, onMenuOpenChange]);

  const desktopActions =
    desktopHeaderActions !== undefined ? (
      desktopHeaderActions
    ) : (
      <Suspense fallback={<span className="plotty-meta">...</span>}>
        <AuthStatus variant="compact" />
      </Suspense>
    );

  return (
    <div
      className={cn(
        "plotty-page-shell",
        showBottomNav ? "!pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:!pb-10" : "!pb-10",
        className,
      )}
    >
      {showMobileBack ? (
        mobileBackHref ? (
          <Link
            href={mobileBackHref}
            aria-label="Назад"
            className={iconButtonClassName({
              size: "md",
              variant: "secondary",
              className:
                "fixed left-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[55] rounded-full bg-[rgba(251,247,242,0.96)] backdrop-blur-xl lg:hidden",
            })}
          >
            <span aria-hidden="true">←</span>
          </Link>
        ) : (
          <IconButton
            aria-label="Назад"
            onClick={() => router.back()}
            className="fixed left-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[55] rounded-full bg-[rgba(251,247,242,0.96)] backdrop-blur-xl lg:hidden"
          >
            <span aria-hidden="true">←</span>
          </IconButton>
        )
      ) : null}

      <section className="plotty-frame">
        <header className="sticky top-0 z-40 border-b border-[var(--plotty-line)] bg-[rgba(251,247,242,0.88)] backdrop-blur-xl">
          <div className="plotty-frame-inner">
            <div className="flex min-h-[76px] items-center gap-3 lg:min-h-[92px] lg:gap-6">
              <Link
                href={routes.home}
                className="plotty-logo inline-flex shrink-0 items-end gap-1 transition-opacity hover:opacity-80"
                aria-label="Plotty, перейти в каталог"
              >
                Plotty
                <Feather className="mb-1 size-6 text-[var(--plotty-accent)] lg:size-7" aria-hidden="true" />
              </Link>

              <nav className="hidden items-stretch gap-1 lg:flex" aria-label="Основная навигация">
                {plottyPrimaryNavItems.map((item) => {
                  const isActive = isPrimaryNavItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "plotty-button-label relative flex min-h-[92px] items-center px-5 text-[var(--plotty-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                        isActive ? "text-[var(--plotty-accent)]" : "hover:text-[var(--plotty-accent)]",
                      )}
                    >
                      {item.label}
                      {isActive ? (
                        <span
                          className="absolute inset-x-5 bottom-0 h-0.5 bg-[var(--plotty-accent)]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <GlobalSearch className="ml-auto hidden w-full max-w-[34rem] lg:flex" />

              <div className="ml-auto hidden items-center gap-3 lg:flex">
                {desktopActions}
              </div>

              {mobileHeaderActions ? (
                <div className="ml-auto flex items-center gap-2 lg:hidden">
                  {mobileHeaderActions}
                </div>
              ) : (
                <div className="ml-auto lg:hidden" />
              )}
            </div>

            {mobileToolbar ? <div className="border-t border-[var(--plotty-line)] py-3 lg:hidden">{mobileToolbar}</div> : null}
          </div>
        </header>

        <div className={cn("plotty-frame-inner pb-6 pt-4 lg:pb-8 lg:pt-7", contentClassName)}>
          {!suppressPageIntro && (pageTitle || pageDescription || pageMeta || pageActions) ? (
            <div className="mb-5 space-y-4 lg:mb-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1.5">
                  {pageMeta ? <div className="flex flex-wrap items-center gap-2">{pageMeta}</div> : null}
                  {pageTitle ? <h1 className="plotty-page-title">{pageTitle}</h1> : null}
                  {pageDescription ? (
                    <p className="plotty-body max-w-3xl text-[var(--plotty-muted)]">{pageDescription}</p>
                  ) : null}
                </div>
                {pageActions ? <div className="flex flex-wrap items-center gap-3">{pageActions}</div> : null}
              </div>
            </div>
          ) : null}

          {children}
        </div>

        {menuContent ? (
          <PlottyMobileSheet open={isMobileMenuOpen} title="Меню" onClose={() => setIsMobileMenuOpen(false)}>
            {menuContent({ closeMenu: () => setIsMobileMenuOpen(false) })}
          </PlottyMobileSheet>
        ) : null}
      </section>

      {showBottomNav ? <PlottyBottomNav /> : null}
    </div>
  );
}

function GlobalSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useOptionalSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(currentQuery);
  const isCatalog = pathname === routes.home;

  useEffect(() => {
    setDraft(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (!isCatalog || draft.trim() === currentQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const normalized = draft.trim();

      if (normalized) {
        nextParams.set("q", normalized);
      } else {
        nextParams.delete("q");
      }
      nextParams.set("page", "1");

      router.replace(nextParams.toString() ? `${routes.home}?${nextParams.toString()}` : routes.home, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuery, draft, isCatalog, router, searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = draft.trim();
    const nextParams = new URLSearchParams();

    if (normalized) {
      nextParams.set("q", normalized);
    }

    router.push(nextParams.toString() ? `${routes.home}?${nextParams.toString()}` : routes.home);
  }

  return (
    <form
      className={cn(
        "items-center gap-3 rounded-full border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.86)] px-4 py-2 shadow-[0_8px_24px_rgba(58,43,27,0.05)]",
        className,
      )}
      role="search"
      onSubmit={handleSubmit}
    >
      <Search className="size-5 shrink-0 text-[var(--plotty-muted)]" aria-hidden="true" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Поиск историй, авторов и фандомов"
        placeholder="Поиск историй, авторов и фандомов"
        className="min-h-8 border-0 bg-transparent px-0 shadow-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </form>
  );
}

export function PlottySectionCard({
  title,
  description,
  children,
  className,
  headerClassName,
  variant = "default",
  ...props
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  variant?: SurfaceVariant;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Card variant={variant} className={cn("space-y-4 p-4 sm:p-5 lg:p-6", className)} {...props}>
      {title ? (
        <div className={cn("space-y-1.5", headerClassName)}>
          <div className="plotty-section-title">{title}</div>
          {description ? <p className="plotty-meta">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </Card>
  );
}

export function PlottyAppMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <nav className="grid gap-2" aria-label="Мобильная навигация">
        {plottyPrimaryNavItems.map((item) => {
          const isActive = isPrimaryNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-[var(--plotty-radius-md)] border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                isActive
                  ? "border-transparent bg-[var(--plotty-accent)] !text-white visited:!text-white"
                  : "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.8)] text-[var(--plotty-muted)]",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Suspense fallback={<span className="plotty-meta">Проверяем сессию...</span>}>
        <AuthStatus variant="menu" />
      </Suspense>
    </div>
  );
}

export function PlottyMobileSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} title={title} closeLabel="Закрыть" onClose={onClose}>
      {children}
    </Sheet>
  );
}

function PlottyBottomNav() {
  const pathname = usePathname();
  const searchParams = useOptionalSearchParams();
  const { user, isAuthenticated } = useAuth();
  const currentUrl = buildNextUrl(pathname, new URLSearchParams(searchParams));
  const profileHref = isAuthenticated && user?.username ? routes.user(user.username) : routes.auth({ next: currentUrl });
  const libraryHref = isAuthenticated ? routes.library : routes.auth({ next: routes.library });
  const writeHref = isAuthenticated ? routes.write : routes.auth({ next: routes.write });
  const items = useMemo(
    () => [
      { href: routes.home, label: "Каталог", icon: BookOpen, active: pathname === routes.home },
      { href: libraryHref, label: "Мои истории", icon: Library, active: pathname.startsWith(routes.library) },
      { href: writeHref, label: "Мастерская", icon: PenLine, active: pathname.startsWith(routes.write) },
      { href: profileHref, label: "Профиль", icon: UserRound, active: pathname.startsWith("/users/") },
    ],
    [libraryHref, pathname, profileHref, writeHref],
  );

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-[var(--plotty-line)] bg-[rgba(251,247,242,0.94)] px-2 py-1.5 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl lg:hidden"
      aria-label="Нижняя навигация"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-[3.6rem] flex-col items-center justify-center gap-1 rounded-[16px] px-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                item.active
                  ? "text-[var(--plotty-accent)] [&_span]:text-[var(--plotty-accent)] [&_svg]:text-[var(--plotty-accent)]"
                  : "text-[var(--plotty-muted)]",
              )}
            >
              <Icon className="size-[19px]" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PlottySurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("plotty-surface", className)} {...props} />;
}
