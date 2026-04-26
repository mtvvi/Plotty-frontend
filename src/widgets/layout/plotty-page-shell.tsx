"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { iconButtonClassName, IconButton } from "@/shared/ui/icon-button";
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
        "plotty-page-shell !pt-0 lg:!pt-6",
        showBottomNav && menuContent ? "!pb-[calc(7rem+env(safe-area-inset-bottom))]" : "!pb-12",
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
              className: "fixed left-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[55] rounded-full bg-[rgba(247,242,234,0.96)] backdrop-blur-xl lg:hidden",
            })}
          >
            <span aria-hidden="true">←</span>
          </Link>
        ) : (
          <IconButton
            aria-label="Назад"
            onClick={() => router.back()}
            className="fixed left-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[55] rounded-full bg-[rgba(247,242,234,0.96)] backdrop-blur-xl lg:hidden"
          >
            <span aria-hidden="true">←</span>
          </IconButton>
        )
      ) : null}

      <section className="plotty-frame">
        <header className="sticky top-0 z-40 border-b border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.84)] backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-7">
            <div className="flex min-h-[68px] items-center gap-3 lg:min-h-[78px] lg:gap-5">
              <Link href={routes.home} className="plotty-logo shrink-0 transition-opacity hover:opacity-80 lg:flex-1">
                Plotty
              </Link>

              <div className="hidden flex-1 justify-center lg:flex">
                <div className="flex items-center gap-2">
                  <nav className="inline-flex items-center gap-1" aria-label="Основная навигация">
                    <div className="inline-flex items-center rounded-full border border-[rgba(41,38,34,0.08)] bg-white/84 p-1 shadow-[0_8px_24px_rgba(46,35,23,0.08)]">
                      {plottyPrimaryNavItems.map((item) => {
                        const isActive = isPrimaryNavItemActive(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "plotty-button-label inline-flex min-h-[46px] items-center justify-center rounded-full px-5 text-sm transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                              isActive
                                ? "bg-[var(--plotty-accent)] !text-white visited:!text-white hover:!text-white shadow-[0_8px_18px_rgba(188,95,61,0.16)]"
                                : "text-[var(--plotty-muted)] hover:bg-white/70 hover:text-[var(--plotty-ink)]",
                            )}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </nav>
                  {desktopActions}
                </div>
              </div>

              {mobileHeaderActions ? (
                <div className="ml-auto flex items-center gap-2 lg:hidden">
                  {mobileHeaderActions}
                </div>
              ) : <div className="ml-auto lg:hidden" />}

              <div className="hidden lg:block lg:flex-1" aria-hidden="true" />
            </div>

            {mobileToolbar ? <div className="border-t border-[rgba(41,38,34,0.08)] py-3 lg:hidden">{mobileToolbar}</div> : null}
          </div>
        </header>

        <div className={cn("px-4 pb-6 pt-3.5 sm:px-6 lg:px-7 lg:pb-7 lg:pt-[18px]", contentClassName)}>
          {!suppressPageIntro && (pageTitle || pageDescription || pageMeta || pageActions) ? (
            <div className="mb-4 space-y-3.5 lg:mb-6">
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

      {showBottomNav && menuContent ? (
        <PlottyBottomNav activeCatalog={pathname === routes.home} onMenuOpen={() => setIsMobileMenuOpen(true)} />
      ) : null}
    </div>
  );
}

export function PlottySectionCard({
  title,
  description,
  children,
  className,
  headerClassName,
  ...props
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn("space-y-4 p-4 sm:p-5 lg:p-[22px]", className)} {...props}>
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
                "rounded-[16px] border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                isActive
                  ? "border-transparent bg-[var(--plotty-accent)] !text-white visited:!text-white hover:bg-[#a65434]"
                  : "border-[var(--plotty-line)] bg-white/80 text-[var(--plotty-muted)]",
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

function PlottyBottomNav({
  activeCatalog,
  onMenuOpen,
}: {
  activeCatalog?: boolean;
  onMenuOpen: () => void;
}) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.94)] p-2 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl lg:hidden"
      aria-label="Нижняя навигация"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={routes.home}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-[16px] px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
            activeCatalog ? "bg-[var(--plotty-accent)] !text-white visited:!text-white hover:bg-[#a65434]" : "text-[var(--plotty-muted)]",
          )}
        >
          Каталог
        </Link>
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex min-h-11 items-center justify-center rounded-[16px] px-3 text-sm font-semibold text-[var(--plotty-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        >
          Меню
        </button>
      </div>
    </nav>
  );
}

export function PlottySurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("plotty-surface", className)} {...props} />;
}
