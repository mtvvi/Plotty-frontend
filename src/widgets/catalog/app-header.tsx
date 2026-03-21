import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function AppHeader() {
  return (
    <header>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--plotty-line)] bg-white/35 px-7 py-3 text-[13px] text-[var(--plotty-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span>Онлайн: 14 802 читателя</span>
          <span>•</span>
          <span>Новый фандом недели: «Аркейн»</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={routes.home}>Мои закладки</Link>
          <Link href={routes.home}>Уведомления</Link>
          <Link href={routes.home}>Профиль автора</Link>
        </div>
      </div>

      <div className="space-y-6 px-7 py-6">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_auto]">
          <div className="flex items-baseline gap-3">
            <span className="plotty-serif text-[34px] font-bold tracking-[-0.04em]">Plotty</span>
            <Badge tone="accent">beta-reader AI</Badge>
          </div>

          <Card className="grid h-[58px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4">
            <span className="text-xl text-[var(--plotty-muted)]">⌕</span>
            <span className="text-sm text-[var(--plotty-muted)]">
              поиск по фандому, названию, персонажу или тегу
            </span>
            <span className="rounded-[10px] bg-[var(--plotty-panel)] px-2.5 py-1 text-xs font-bold text-[var(--plotty-muted)]">
              /
            </span>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button>Черновики</Button>
            <Button variant="primary">Начать писать</Button>
          </div>
        </div>
      </div>
    </header>
  );
}

