import Link from "next/link";

import type { StoryListItem } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";
import { Card } from "@/shared/ui/card";

import { StoryTagChip } from "./story-tag-chip";

function formatUpdate(updatedAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(updatedAt));
}

export function StoryCard({ story }: { story: StoryListItem }) {
  return (
    <Card className="grid gap-4 border-[var(--plotty-line-strong)] p-4 md:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Link href={routes.story(story.slug)} className="inline-block">
            <h3 className="plotty-serif text-3xl font-semibold tracking-[-0.03em] hover:text-[var(--plotty-accent)]">
              {story.title}
            </h3>
          </Link>
          <p className="text-sm leading-7 text-[var(--plotty-muted)]">{story.excerpt}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <StoryTagChip key={tag.id} tag={tag} />
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-[20px] bg-[var(--plotty-panel)] p-4">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--plotty-muted)]">
          {story.status === "published" ? "Опубликовано" : "Черновик"}
        </div>
        <div className="text-sm leading-6 text-[var(--plotty-muted)]">{story.description}</div>
        <div className="text-sm text-[var(--plotty-muted)]">
          {story.chaptersCount} {story.chaptersCount === 1 ? "глава" : "глав"}
        </div>
        <div className="text-sm text-[var(--plotty-muted)]">Обновлено {formatUpdate(story.updatedAt)}</div>
      </div>
    </Card>
  );
}
