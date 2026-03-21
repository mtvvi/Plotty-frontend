"use client";

import type { CatalogMetaResponse, CatalogQuery } from "@/entities/catalog/model/types";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { TabButton } from "@/shared/ui/tabs";

interface CatalogResultBarProps {
  query: CatalogQuery;
  meta: CatalogMetaResponse;
  total: number;
  onChange: (next: Partial<CatalogQuery>) => void;
}

export function CatalogResultBar({ query, meta, total, onChange }: CatalogResultBarProps) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {meta.filterOptions.sortTabs.map((tab) => (
          <TabButton
            key={tab.value}
            isActive={query.sort === tab.value}
            onClick={() => onChange({ sort: tab.value })}
            type="button"
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge>{total.toLocaleString("ru-RU")} результатов</Badge>
        <div className="flex items-center gap-2">
          <TabButton isActive={query.view === "feed"} onClick={() => onChange({ view: "feed" })} type="button">
            Лента
          </TabButton>
          <TabButton isActive={query.view === "tiles"} onClick={() => onChange({ view: "tiles" })} type="button">
            Плитка
          </TabButton>
        </div>
      </div>
    </Card>
  );
}

