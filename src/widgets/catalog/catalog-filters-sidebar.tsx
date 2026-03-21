"use client";

import type { CatalogMetaResponse, CatalogQuery } from "@/entities/catalog/model/types";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { Section } from "@/shared/ui/section";

interface CatalogFiltersSidebarProps {
  query: CatalogQuery;
  meta: CatalogMetaResponse;
  onChange: (next: Partial<CatalogQuery>) => void;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-bold transition-colors",
        active
          ? "border-[var(--plotty-ink)] bg-[var(--plotty-ink)] text-[var(--plotty-paper)]"
          : "border-[var(--plotty-line)] bg-white/70 text-[var(--plotty-muted)] hover:bg-white",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function CatalogFiltersSidebar({
  query,
  meta,
  onChange,
}: CatalogFiltersSidebarProps) {
  return (
    <aside className="space-y-4">
      <Card className="p-4">
        <Section title="Фильтры" className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Фандомы</h3>
            <div className="flex flex-wrap gap-2">
              {meta.filterOptions.fandoms.map((fandom) => (
                <FilterChip
                  key={fandom}
                  label={fandom}
                  active={query.fandom === fandom}
                  onClick={() => onChange({ fandom: query.fandom === fandom ? "" : fandom, page: 1 })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Статус</h3>
            <div className="flex flex-wrap gap-2">
              {meta.filterOptions.statuses.map((status) => (
                <FilterChip
                  key={status.value}
                  label={status.label}
                  active={query.status === status.value}
                  onClick={() =>
                    onChange({
                      status: query.status === status.value ? "" : status.value,
                      page: 1,
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Рейтинг</h3>
            <div className="flex flex-wrap gap-2">
              {meta.filterOptions.ratings.map((rating) => (
                <FilterChip
                  key={rating}
                  label={rating}
                  active={query.rating === rating}
                  onClick={() => onChange({ rating: query.rating === rating ? "" : rating, page: 1 })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Размер</h3>
            <div className="flex flex-wrap gap-2">
              {meta.filterOptions.sizes.map((size) => (
                <FilterChip
                  key={size.value}
                  label={size.label}
                  active={query.size === size.value}
                  onClick={() => onChange({ size: query.size === size.value ? "" : size.value, page: 1 })}
                />
              ))}
            </div>
          </div>
        </Section>
      </Card>
    </aside>
  );
}

