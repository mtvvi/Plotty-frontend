import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";

const navItems = [
  { href: routes.home, label: "Каталог", active: true },
  { href: routes.fandoms, label: "Фандомы" },
  { href: routes.authors, label: "Авторы" },
  { href: routes.recommendations, label: "Рекомендации" },
  { href: routes.write, label: "Написать" },
];

export function CatalogNav() {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-[var(--plotty-line)] px-7 pb-6 lg:flex-row lg:items-center">
      <nav className="flex flex-wrap items-center gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3.5 py-2.5 text-sm font-bold ${
              item.active
                ? "bg-black/7 text-[var(--plotty-ink)]"
                : "text-[var(--plotty-muted)] hover:bg-white/70"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Проверка канона</Badge>
        <Badge tone="gold">Сводки по главам</Badge>
      </div>
    </div>
  );
}

