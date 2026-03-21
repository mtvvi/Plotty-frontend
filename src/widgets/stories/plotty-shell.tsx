import type { ReactNode } from "react";
import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function PlottyShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="plotty-page-shell">
      <section className="plotty-frame">
        <header className="border-b border-[var(--plotty-line)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--plotty-line)] bg-white/35 px-7 py-3 text-[13px] text-[var(--plotty-muted)]">
            <div className="flex flex-wrap items-center gap-3">
              <span>Plotty</span>
              <span>•</span>
              <span>истории, главы и AI-бета-ридер</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={routes.home}>Каталог</Link>
              <Link href={routes.write}>Новая история</Link>
            </div>
          </div>

          <div className="grid gap-4 px-7 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="space-y-4">
              <Link href={routes.home} className="plotty-serif inline-block text-[34px] font-bold tracking-[-0.04em]">
                Plotty
              </Link>
              <div className="space-y-3">
                <h1 className="plotty-serif max-w-[760px] text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                  {title}
                </h1>
                <p className="max-w-[680px] text-sm leading-7 text-[var(--plotty-muted)]">{description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={routes.home}>
                <Button variant="secondary">Каталог</Button>
              </Link>
              <Link href={routes.write}>
                <Button variant="primary">Новая история</Button>
              </Link>
              {actions}
            </div>
          </div>
        </header>

        <div className="px-7 py-6">{children}</div>
      </section>
    </div>
  );
}

export function ShellCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-4 p-5">
      {title ? (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm leading-6 text-[var(--plotty-muted)]">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
