"use client";

import type { CSSProperties, FormEvent, HTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { createContext, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "@/shared/ui/input";
import { Sheet } from "@/shared/ui/sheet";
import { AuthStatus } from "@/widgets/auth/auth-status";

export const plottyPrimaryNavItems = [
  { href: routes.home, label: "Каталог" },
  { href: routes.write, label: "Мастерская" },
  { href: routes.library, label: "Моя полка" },
] as const;

type PrimaryNavItem = (typeof plottyPrimaryNavItems)[number];
type PrimaryNavHref = PrimaryNavItem["href"];
type HeaderNavKey = PrimaryNavHref | "profile";
type BottomNavKey = "catalog" | "library" | "write" | "profile";
type BottomNavItem = {
  key: BottomNavKey;
  href: string;
  label: string;
  icon: typeof BookOpen;
  active: boolean;
};

const navIndicatorLastActiveKeys = new Map<string, string>();
const hiddenNavIndicatorStyle: CSSProperties = {
  opacity: 0,
  transform: "translate3d(0px, 0, 0)",
  width: 0,
};

interface NavIndicatorMeasurement {
  left: number;
  width: number;
}

function isPrimaryNavItemActive(pathname: string, href: string) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldHandlePrimaryNavClick(event: ReactMouseEvent<HTMLAnchorElement>) {
  const target = event.currentTarget.getAttribute("target");

  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (!target || target === "_self")
  );
}

function useOptimisticPrimaryNav(pathname: string, actualActiveHref: PrimaryNavHref | null) {
  const router = useRouter();
  const [pendingNav, setPendingNav] = useState<{ href: PrimaryNavHref; fromPathname: string } | null>(null);

  useEffect(() => {
    if (!pendingNav) {
      return;
    }

    if (isPrimaryNavItemActive(pathname, pendingNav.href) || pathname !== pendingNav.fromPathname) {
      setPendingNav(null);
    }
  }, [pathname, pendingNav]);

  useEffect(() => {
    if (!pendingNav) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingNav((current) => (current === pendingNav ? null : current));
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [pendingNav]);

  const handlePrimaryNavClick = useCallback(
    (href: PrimaryNavHref, event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (!shouldHandlePrimaryNavClick(event)) {
        return;
      }

      if (isPrimaryNavItemActive(pathname, href)) {
        return;
      }

      event.preventDefault();
      setPendingNav({ href, fromPathname: pathname });
      router.push(href);
    },
    [pathname, router],
  );

  return {
    activePrimaryNavHref: pendingNav?.href ?? actualActiveHref,
    handlePrimaryNavClick,
  };
}

function getNavItemMeasurement(container: HTMLElement | null, item: HTMLElement | null): NavIndicatorMeasurement | null {
  if (!container || !item) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const itemStyle = window.getComputedStyle(item);
  const paddingLeft = Number.parseFloat(itemStyle.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(itemStyle.paddingRight) || 0;
  const width = Math.max(0, itemRect.width - paddingLeft - paddingRight);

  if (!width) {
    return null;
  }

  return {
    left: itemRect.left - containerRect.left + paddingLeft,
    width,
  };
}

function getNavIndicatorStyle(measurement: NavIndicatorMeasurement | null, options?: { disableTransition?: boolean }): CSSProperties {
  if (!measurement) {
    return hiddenNavIndicatorStyle;
  }

  return {
    opacity: 1,
    transform: `translate3d(${measurement.left.toFixed(2)}px, 0, 0)`,
    transition: options?.disableTransition ? "none" : undefined,
    width: `${measurement.width.toFixed(2)}px`,
  };
}

function getCollapsedNavIndicatorStyle(measurement: NavIndicatorMeasurement, options?: { disableTransition?: boolean }): CSSProperties {
  return {
    opacity: 1,
    transform: `translate3d(${(measurement.left + measurement.width / 2).toFixed(2)}px, 0, 0)`,
    transition: options?.disableTransition ? "none" : undefined,
    width: 0,
  };
}

function useSlidingNavIndicator<ItemKey extends string>(scope: string, activeKey: ItemKey | null) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<ItemKey, HTMLElement>());
  const frameRef = useRef<number | null>(null);
  const hasMeasuredRef = useRef(false);
  const isIndicatorVisibleRef = useRef(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>(hiddenNavIndicatorStyle);

  const setContainerRef = useCallback((node: HTMLElement | null) => {
    if (containerRef.current === node) {
      return;
    }

    containerRef.current = node;
    setLayoutVersion((current) => current + 1);
  }, []);

  const setItemRef = useCallback((key: ItemKey, node: HTMLElement | null) => {
    if (node) {
      if (itemRefs.current.get(key) === node) {
        return;
      }

      itemRefs.current.set(key, node);
      setLayoutVersion((current) => current + 1);
    }
  }, []);

  useLayoutEffect(() => {
    function cancelScheduledAnimation() {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }

    function measureKey(key: ItemKey | string | null) {
      if (!key) {
        return null;
      }

      return getNavItemMeasurement(containerRef.current, itemRefs.current.get(key as ItemKey) ?? null);
    }

    function updateIndicator() {
      cancelScheduledAnimation();

      const currentMeasurement = measureKey(activeKey);

      if (!activeKey || !currentMeasurement) {
        setIndicatorStyle(hiddenNavIndicatorStyle);
        hasMeasuredRef.current = true;
        isIndicatorVisibleRef.current = false;
        navIndicatorLastActiveKeys.delete(scope);
        return;
      }

      const previousKey = navIndicatorLastActiveKeys.get(scope);
      const previousMeasurement =
        !hasMeasuredRef.current && previousKey && previousKey !== activeKey ? measureKey(previousKey) : null;

      if (previousMeasurement) {
        setIndicatorStyle(getNavIndicatorStyle(previousMeasurement, { disableTransition: true }));
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = window.requestAnimationFrame(() => {
            setIndicatorStyle(getNavIndicatorStyle(currentMeasurement));
            frameRef.current = null;
          });
        });
      } else if (!hasMeasuredRef.current || !isIndicatorVisibleRef.current) {
        setIndicatorStyle(getCollapsedNavIndicatorStyle(currentMeasurement, { disableTransition: true }));
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = window.requestAnimationFrame(() => {
            setIndicatorStyle(getNavIndicatorStyle(currentMeasurement));
            frameRef.current = null;
          });
        });
      } else {
        setIndicatorStyle(getNavIndicatorStyle(currentMeasurement));
      }

      hasMeasuredRef.current = true;
      isIndicatorVisibleRef.current = true;
      navIndicatorLastActiveKeys.set(scope, activeKey);
    }

    updateIndicator();

    const activeItem = activeKey ? itemRefs.current.get(activeKey) : null;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null;

    if (resizeObserver) {
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      if (activeItem) {
        resizeObserver.observe(activeItem);
      }
    }

    window.addEventListener("resize", updateIndicator);

    return () => {
      cancelScheduledAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeKey, layoutVersion, scope]);

  return { containerRef: setContainerRef, indicatorStyle, setItemRef };
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

const PlottyChromeContext = createContext(false);

type PlottyPageShellProps = {
  children: ReactNode;
  pageTitle?: ReactNode;
  pageDescription?: string;
  pageMeta?: ReactNode;
  pageActions?: ReactNode;
  desktopHeaderActions?: ReactNode;
  mobileHeaderActions?: ReactNode;
  mobileToolbar?: ReactNode;
  contentClassName?: string;
  showBottomNav?: boolean;
  suppressPageIntro?: boolean;
  className?: string;
};

const chromeMinimalRoutes = new Set(["/auth", "/authors", "/fandoms", "/recommendations"]);

function shouldUseMinimalPersistentChrome(pathname: string) {
  return chromeMinimalRoutes.has(pathname);
}

function DefaultDesktopActions({
  profileIndicatorRef,
}: {
  profileIndicatorRef?: (node: HTMLAnchorElement | null) => void;
}) {
  return (
    <Suspense fallback={<span className="plotty-meta">...</span>}>
      <AuthStatus
        variant="compact"
        profileIndicatorRef={profileIndicatorRef}
        showInlineActiveIndicator={!profileIndicatorRef}
      />
    </Suspense>
  );
}

function DesktopPrimaryNavLink({
  item,
  isActive,
  isCurrent,
  onNavigate,
  setItemRef,
}: {
  item: PrimaryNavItem;
  isActive: boolean;
  isCurrent: boolean;
  onNavigate: (href: PrimaryNavHref, event: ReactMouseEvent<HTMLAnchorElement>) => void;
  setItemRef: (key: HeaderNavKey, node: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      ref={(node) => setItemRef(item.href, node)}
      href={item.href}
      aria-current={isCurrent ? "page" : undefined}
      onClick={(event) => onNavigate(item.href, event)}
      className={cn(
        "plotty-nav-link plotty-button-label relative z-10 flex min-h-[86px] items-center px-4 text-[var(--plotty-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
        "whitespace-nowrap",
        isActive ? "text-[var(--plotty-accent)]" : "hover:text-[var(--plotty-accent)]",
      )}
    >
      <span>{item.label}</span>
    </Link>
  );
}

export function PlottyPageShell(props: PlottyPageShellProps) {
  const isInsidePersistentChrome = useContext(PlottyChromeContext);

  if (isInsidePersistentChrome) {
    return <PlottyPageContent {...props} />;
  }

  return <PlottyPageShellFallback {...props} />;
}

function PlottyPageShellFallback({
  children,
  pageTitle,
  pageDescription,
  pageMeta,
  pageActions,
  desktopHeaderActions,
  mobileHeaderActions,
  mobileToolbar,
  contentClassName,
  showBottomNav = true,
  suppressPageIntro = false,
  className,
}: PlottyPageShellProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const actualActivePrimaryNavHref = plottyPrimaryNavItems.find((item) => isPrimaryNavItemActive(pathname, item.href))?.href ?? null;
  const { activePrimaryNavHref, handlePrimaryNavClick } = useOptimisticPrimaryNav(
    pathname,
    actualActivePrimaryNavHref,
  );
  const profileHref = isAuthenticated && user?.username ? routes.user(user.username) : null;
  const isProfileActive = Boolean(profileHref && (pathname === profileHref || pathname.startsWith(`${profileHref}/`)));
  const activeHeaderNavKey: HeaderNavKey | null =
    activePrimaryNavHref ?? (desktopHeaderActions === undefined && isProfileActive ? "profile" : null);
  const {
    containerRef: primaryNavRef,
    indicatorStyle: primaryNavIndicatorStyle,
    setItemRef: setPrimaryNavItemRef,
  } = useSlidingNavIndicator("desktop-primary", activeHeaderNavKey);

  const desktopActions =
    desktopHeaderActions !== undefined ? (
      desktopHeaderActions
    ) : (
      <DefaultDesktopActions profileIndicatorRef={(node) => setPrimaryNavItemRef("profile", node)} />
    );

  return (
    <div
      className={cn(
        "plotty-page-shell",
        showBottomNav ? "!pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:!pb-10" : "!pb-10",
        className,
      )}
    >
      <section className="plotty-frame">
        <header className="plotty-header sticky top-0 z-40">
          <div className="plotty-frame-inner">
            <div ref={primaryNavRef} className="relative flex min-h-[76px] items-center gap-3 lg:min-h-[86px] lg:gap-5">
              <Link
                href={routes.home}
                className="plotty-logo inline-flex shrink-0 items-end gap-1 transition-opacity hover:opacity-80"
                aria-label="Plotty, перейти в каталог"
              >
                Plotty
                <Feather className="mb-1 size-6 text-[var(--plotty-accent)] lg:size-7" aria-hidden="true" />
              </Link>

              <nav className="relative hidden shrink-0 items-stretch gap-1 lg:flex" aria-label="Основная навигация">
                {plottyPrimaryNavItems.map((item) => {
                  const isCurrent = isPrimaryNavItemActive(pathname, item.href);
                  const isActive = activePrimaryNavHref === item.href;

                  return (
                    <DesktopPrimaryNavLink
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      isCurrent={isCurrent}
                      onNavigate={handlePrimaryNavClick}
                      setItemRef={setPrimaryNavItemRef}
                    />
                  );
                })}
              </nav>

              <GlobalSearch className="hidden min-w-0 flex-1 lg:flex" />

              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                {desktopActions}
              </div>

              {mobileHeaderActions ? (
                <div className="ml-auto flex items-center gap-2 lg:hidden">
                  {mobileHeaderActions}
                </div>
              ) : (
                <div className="ml-auto lg:hidden" />
              )}
              <span className="plotty-nav-indicator" style={primaryNavIndicatorStyle} aria-hidden="true" />
            </div>

            {mobileToolbar ? <div className="border-t border-[var(--plotty-line)] py-3 lg:hidden">{mobileToolbar}</div> : null}
          </div>
        </header>

        <div key={pathname} className={cn("plotty-frame-inner plotty-page-enter pb-6 pt-4 lg:pb-10 lg:pt-8", contentClassName)}>
          {!suppressPageIntro && (pageTitle || pageDescription || pageMeta || pageActions) ? (
            <div className="mb-5 space-y-4 lg:mb-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

      </section>

      {showBottomNav ? <PlottyBottomNav /> : null}
    </div>
  );
}

export function PlottyAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const useMinimalChrome = shouldUseMinimalPersistentChrome(pathname);
  const showBottomNav = !useMinimalChrome;

  return (
    <div className={cn("plotty-page-shell", showBottomNav ? "!pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:!pb-10" : "!pb-10")}>
      <section className="plotty-frame">
        <PersistentPlottyHeader showDesktopActions={!useMinimalChrome} />

        <PlottyChromeContext.Provider value={true}>{children}</PlottyChromeContext.Provider>
      </section>

      {showBottomNav ? <PlottyBottomNav /> : null}
    </div>
  );
}

function PersistentPlottyHeader({
  showDesktopActions,
}: {
  showDesktopActions: boolean;
}) {
  const pathname = usePathname();
  const actualActivePrimaryNavHref = plottyPrimaryNavItems.find((item) => isPrimaryNavItemActive(pathname, item.href))?.href ?? null;
  const { activePrimaryNavHref, handlePrimaryNavClick } = useOptimisticPrimaryNav(
    pathname,
    actualActivePrimaryNavHref,
  );
  const { user, isAuthenticated } = useAuth();
  const profileHref = isAuthenticated && user?.username ? routes.user(user.username) : null;
  const isProfileActive = Boolean(profileHref && (pathname === profileHref || pathname.startsWith(`${profileHref}/`)));
  const activeHeaderNavKey: HeaderNavKey | null =
    activePrimaryNavHref ?? (showDesktopActions && isProfileActive ? "profile" : null);
  const {
    containerRef: primaryNavRef,
    indicatorStyle: primaryNavIndicatorStyle,
    setItemRef: setPrimaryNavItemRef,
  } = useSlidingNavIndicator("desktop-primary", activeHeaderNavKey);

  return (
    <header className="plotty-header sticky top-0 z-40">
      <div className="plotty-frame-inner">
        <div ref={primaryNavRef} className="relative flex min-h-[76px] items-center gap-3 lg:min-h-[86px] lg:gap-5">
          <Link
            href={routes.home}
            className="plotty-logo inline-flex shrink-0 items-end gap-1 transition-opacity hover:opacity-80"
            aria-label="Plotty"
          >
            Plotty
            <Feather className="mb-1 size-6 text-[var(--plotty-accent)] lg:size-7" aria-hidden="true" />
          </Link>

          <nav className="relative hidden shrink-0 items-stretch gap-1 lg:flex" aria-label="Primary navigation">
            {plottyPrimaryNavItems.map((item) => {
              const isCurrent = isPrimaryNavItemActive(pathname, item.href);
              const isActive = activePrimaryNavHref === item.href;

              return (
                <DesktopPrimaryNavLink
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  isCurrent={isCurrent}
                  onNavigate={handlePrimaryNavClick}
                  setItemRef={setPrimaryNavItemRef}
                />
              );
            })}
          </nav>

          <GlobalSearch className="hidden min-w-0 flex-1 lg:flex" />

          {showDesktopActions ? (
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <DefaultDesktopActions profileIndicatorRef={(node) => setPrimaryNavItemRef("profile", node)} />
            </div>
          ) : null}
          <span className="plotty-nav-indicator" style={primaryNavIndicatorStyle} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function PlottyPageContent({
  children,
  pageTitle,
  pageDescription,
  pageMeta,
  pageActions,
  mobileToolbar,
  contentClassName,
  suppressPageIntro = false,
}: PlottyPageShellProps) {
  const pathname = usePathname();

  return (
    <>
      <div key={pathname} className={cn("plotty-frame-inner plotty-page-enter pb-6 pt-4 lg:pb-10 lg:pt-8", contentClassName)}>
        {mobileToolbar ? <div className="mb-5 border-b border-[var(--plotty-line)] pb-4 lg:hidden">{mobileToolbar}</div> : null}

        {!suppressPageIntro && (pageTitle || pageDescription || pageMeta || pageActions) ? (
          <div className="mb-5 space-y-4 lg:mb-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
    </>
  );
}

function GlobalSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useOptionalSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(currentQuery);
  const isCatalog = pathname === routes.home;
  const lastRequestedQueryRef = useRef(currentQuery);

  useEffect(() => {
    if (currentQuery !== lastRequestedQueryRef.current) {
      setDraft(currentQuery);
      lastRequestedQueryRef.current = currentQuery;
    }
  }, [currentQuery]);

  useEffect(() => {
    if (!isCatalog || draft.trim() === currentQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const normalized = draft.trim();
      lastRequestedQueryRef.current = normalized;

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
    lastRequestedQueryRef.current = normalized;

    if (normalized) {
      nextParams.set("q", normalized);
    }

    router.push(nextParams.toString() ? `${routes.home}?${nextParams.toString()}` : routes.home);
  }

  return (
    <form
      className={cn(
        "plotty-search-shell items-center gap-3 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.88)] px-4 py-2.5 shadow-[0_10px_28px_rgba(58,43,27,0.05)]",
        className,
      )}
      role="search"
      onSubmit={handleSubmit}
    >
      <Search className="size-5 shrink-0 text-[var(--plotty-muted)]" aria-hidden="true" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Глобальный поиск по названию истории"
        placeholder="Поиск по названию истории"
        className="min-h-8 rounded-none border-0 bg-transparent px-0 text-sm shadow-none focus:border-transparent focus:shadow-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
} & Omit<HTMLAttributes<HTMLDivElement>, "title">) {
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useOptionalSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [pendingBottomNav, setPendingBottomNav] = useState<{ key: BottomNavKey; fromPathname: string } | null>(null);
  const currentUrl = buildNextUrl(pathname, new URLSearchParams(searchParams));
  const profileHref = isAuthenticated && user?.username ? routes.user(user.username) : routes.auth({ next: currentUrl });
  const libraryHref = isAuthenticated ? routes.library : routes.auth({ next: routes.library });
  const writeHref = isAuthenticated ? routes.write : routes.auth({ next: routes.write });
  const items = useMemo<BottomNavItem[]>(
    () => [
      { key: "catalog", href: routes.home, label: "Каталог", icon: BookOpen, active: pathname === routes.home },
      { key: "library", href: libraryHref, label: "Моя полка", icon: Library, active: pathname.startsWith(routes.library) },
      { key: "write", href: writeHref, label: "Мастерская", icon: PenLine, active: pathname.startsWith(routes.write) },
      { key: "profile", href: profileHref, label: "Профиль", icon: UserRound, active: pathname.startsWith("/users/") },
    ],
    [libraryHref, pathname, profileHref, writeHref],
  );
  const actualActiveBottomNavKey = items.find((item) => item.active)?.key ?? null;
  const activeBottomNavKey = pendingBottomNav?.key ?? actualActiveBottomNavKey;

  useEffect(() => {
    if (!pendingBottomNav) {
      return;
    }

    if (actualActiveBottomNavKey === pendingBottomNav.key || pathname !== pendingBottomNav.fromPathname) {
      setPendingBottomNav(null);
    }
  }, [actualActiveBottomNavKey, pathname, pendingBottomNav]);

  useEffect(() => {
    if (!pendingBottomNav) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingBottomNav((current) => (current === pendingBottomNav ? null : current));
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [pendingBottomNav]);

  const handleBottomNavClick = useCallback(
    (item: BottomNavItem, event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (!shouldHandlePrimaryNavClick(event)) {
        return;
      }

      if (item.key === activeBottomNavKey) {
        return;
      }

      event.preventDefault();
      setPendingBottomNav({ key: item.key, fromPathname: pathname });
      router.push(item.href);
    },
    [activeBottomNavKey, pathname, router],
  );
  const {
    containerRef: bottomNavRef,
    indicatorStyle: bottomNavIndicatorStyle,
    setItemRef: setBottomNavItemRef,
  } = useSlidingNavIndicator("mobile-bottom", activeBottomNavKey);

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-[var(--plotty-line)] bg-[rgba(251,247,242,0.94)] px-2 py-1.5 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl lg:hidden"
      aria-label="Нижняя навигация"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div ref={bottomNavRef} className="relative grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeBottomNavKey;

          return (
            <Link
              key={item.key}
              ref={(node) => setBottomNavItemRef(item.key, node)}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleBottomNavClick(item, event)}
              className={cn(
                "relative z-10 flex min-h-[3.6rem] flex-col items-center justify-center gap-1 rounded-[16px] px-1 text-[11px] font-semibold transition-[background-color,color,transform] duration-[var(--motion-base)] hover:-translate-y-0.5 hover:bg-[rgba(195,79,50,0.08)] hover:text-[var(--plotty-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                isActive
                  ? "text-[var(--plotty-accent)] [&_span]:text-[var(--plotty-accent)] [&_svg]:text-[var(--plotty-accent)]"
                  : "text-[var(--plotty-muted)]",
              )}
            >
              <Icon className="size-[19px]" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <span className="plotty-nav-indicator" style={bottomNavIndicatorStyle} aria-hidden="true" />
      </div>
    </nav>
  );
}

export function PlottySurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("plotty-surface", className)} {...props} />;
}
