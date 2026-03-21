import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="plotty-page-shell">
      <section className="plotty-frame px-7 py-10">
        <Card className="mx-auto max-w-3xl space-y-5 p-8 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--plotty-muted)]">
            Placeholder route
          </span>
          <h1 className="plotty-serif text-5xl font-semibold">{title}</h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-[var(--plotty-muted)]">{description}</p>
          <div className="flex justify-center">
            <Link href={routes.home}>
              <Button variant="primary">Вернуться в каталог</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

