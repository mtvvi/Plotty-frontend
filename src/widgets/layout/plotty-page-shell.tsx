"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { AuthStatus } from "@/widgets/auth/auth-status";

export const plottyPrimaryNavItems = [
  { href: routes.home, label: "Каталог" },
  { href: routes.write, label: "Мастерская" },
] as const;

export function PlottyPageShell({
  children,
  pageTitle,
  pageDescription,
  pageMeta,
  pageActions,
  desktopHeaderCenter,
  mobileHeaderCenter,
  desktopHeaderActions,
  mobileHeaderActions,
  mobileToolbar,
  contentClassName,
  showBottomNav = true,
  menuContent,
  onMenuOpenChange,
  suppressPageIntro = false,
  className,
}: {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageMeta?: ReactNode;
  pageActions?: ReactNode;
  desktopHeaderCenter?: ReactNode;
  mobileHeaderCenter?: ReactNode;
  desktopHeaderActions?: ReactNode;
  mobileHeaderActions?: ReactNode;
  mobileToolbar?: ReactNode;
  contentClassName?: string;
  showBottomNav?: boolean;
  menuContent?: (options: { closeMenu: () => void }) => ReactNode;
  onMenuOpenChange?: (open: boolean) => void;
  suppressPageIntro?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
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
        "plotty-page-shell !pt-0 lg:!pt-8",
        showBottomNav && menuContent ? "!pb-[calc(7rem+env(safe-area-inset-bottom))]" : "!pb-12",
        className,
      )}
    >
      <section className="plotty-frame">
        <header className="sticky top-0 z-40 border-b border-[var(--plotty-line)] bg-[rgba(247,242,234,0.78)] backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-7">
            <div className="flex min-h-[62px] items-center gap-3 lg:min-h-[68px] lg:gap-4">
              <Link href={routes.home} className="plotty-logo transition-opacity hover:opacity-80">
                Plotty
              </Link>

              <nav className="ml-1 hidden items-center gap-1.5 lg:flex" aria-label="Основная навигация">
                {plottyPrimaryNavItems.map((item) => {
                  const isActive = item.href === pathname;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-[14px] px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
                        isActive ? "bg-black/8 text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-black/5",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {desktopHeaderCenter ? <div className="hidden min-w-0 flex-1 lg:block">{desktopHeaderCenter}</div> : null}

              {mobileHeaderCenter ? <div className="min-w-0 flex-1 lg:hidden">{mobileHeaderCenter}</div> : null}

              <div className={cn("hidden items-center gap-2.5 lg:flex", desktopHeaderCenter ? "ml-0" : "ml-auto")}>
                {desktopActions}
              </div>

              {mobileHeaderActions ? (
                <div className={cn("flex items-center gap-2 lg:hidden", mobileHeaderCenter ? "" : "ml-auto")}>
                  {mobileHeaderActions}
                </div>
              ) : null}
            </div>

            {mobileToolbar ? <div className="border-t border-[var(--plotty-line)] py-3 lg:hidden">{mobileToolbar}</div> : null}
          </div>
        </header>

        <div className={cn("px-4 pb-6 pt-4 sm:px-6 lg:px-7 lg:pb-7 lg:pt-[18px]", contentClassName)}>
          {!suppressPageIntro && (pageTitle || pageDescription || pageMeta || pageActions) ? (
            <div className="mb-5 space-y-3.5 lg:mb-6">
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
    <Card className={cn("space-y-4 p-5 lg:p-[22px]", className)} {...props}>
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
          const isActive = item.href === pathname;

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
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" aria-hidden={!open}>
      <button
        type="button"
        aria-label="Закрыть панель"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(35,33,30,0.4)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[28px] border border-[var(--plotty-line)] bg-[var(--plotty-paper)] p-5 shadow-[var(--plotty-shadow)]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="plotty-section-title">
            {title}
          </h2>
          <Button variant="secondary" className="h-10 px-3 text-sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        {children}
      </div>
    </div>
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
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-[var(--plotty-line)] bg-[rgba(247,242,234,0.94)] p-2 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl lg:hidden"
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
