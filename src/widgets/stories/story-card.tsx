import Link from "next/link";

import type { StoryListItem } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";

export function StoryCard({ story }: { story: StoryListItem }) {
  return (
    <Link
      href={routes.story(story.slug)}
      className="block space-y-4 rounded-[20px] border border-[rgba(35,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-[18px] shadow-none transition-transform transition-shadow hover:-translate-y-[1px] hover:shadow-[var(--plotty-shadow-soft)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-[6px]">
          <h2 className="text-[22px] font-bold leading-none tracking-[-0.03em]">{story.title}</h2>
          <div className="flex flex-wrap gap-x-[10px] gap-y-1 text-[13px] text-[var(--plotty-muted)]">
            {story.fandom ? <span>{story.fandom}</span> : null}
            {story.ratingLabel ? <span>{story.ratingLabel}</span> : null}
            {story.statusLabel ? <span>{story.statusLabel}</span> : null}
          </div>
        </div>

        <span className="rounded-[12px] bg-[rgba(54,81,63,0.08)] px-[10px] py-[8px] text-[13px] font-bold text-[var(--plotty-olive)]">
          {story.chaptersCount} глав
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {story.tags.slice(0, 5).map((tag) => (
          <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-[10px]">
          <CatalogMiniStat>Создана {new Date(story.createdAt).toLocaleDateString("ru-RU")}</CatalogMiniStat>
          <CatalogMiniStat>Обновлена {new Date(story.updatedAt).toLocaleDateString("ru-RU")}</CatalogMiniStat>
        </div>

        <span className="inline-flex h-[38px] items-center justify-center rounded-[12px] bg-[var(--plotty-gold-soft)] px-[14px] text-[13px] font-extrabold text-[#6b4d15]">
          Открыть историю
        </span>
      </div>
    </Link>
  );
}

function CatalogMetaChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[var(--plotty-panel)] px-3 py-2 text-[13px] font-bold">{children}</span>;
}

function CatalogMiniStat({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[12px] bg-[var(--plotty-paper)] px-[11px] py-[8px] text-[13px] font-bold">{children}</span>;
}
