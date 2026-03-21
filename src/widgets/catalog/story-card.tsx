import type { CatalogStoryCard } from "@/entities/catalog/model/types";
import { mapStorySizeLabel, mapStoryStatusLabel } from "@/entities/catalog/model/mappers";
import { Card } from "@/shared/ui/card";

interface StoryCardProps {
  story: CatalogStoryCard;
  view: "feed" | "tiles";
}

const coverBackgrounds: Record<string, string> = {
  "story-1": "linear-gradient(135deg, #523120, #8f5a3c 55%, #d9ba93)",
  "story-2": "linear-gradient(135deg, #233d2c, #60794a 55%, #c7d2aa)",
  "story-3": "linear-gradient(135deg, #441b30, #9e5877 55%, #f0d0dd)",
  "story-4": "linear-gradient(135deg, #51412d, #9a7b57 55%, #f1e0bf)",
  "story-5": "linear-gradient(135deg, #1f3c45, #4a7d82 55%, #c6e2dc)",
  "story-6": "linear-gradient(135deg, #213249, #59789d 55%, #d5e1f1)",
};

export function StoryCard({ story, view }: StoryCardProps) {
  return (
    <Card
      className={`overflow-hidden border-[var(--plotty-line-strong)] ${
        view === "tiles" ? "flex h-full flex-col" : "grid gap-4 p-4 md:grid-cols-[240px_minmax(0,1fr)]"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          view === "tiles" ? "h-56 w-full rounded-b-none rounded-t-[20px]" : "min-h-56 rounded-2xl"
        }`}
        style={{ backgroundImage: coverBackgrounds[story.id] }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
          <div className="plotty-serif text-2xl font-semibold text-[var(--plotty-paper)]">{story.title}</div>
        </div>
      </div>

      <div className={`space-y-4 ${view === "tiles" ? "p-4" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">{story.title}</h3>
            <p className="text-sm leading-6 text-[var(--plotty-muted)]">
              {story.fandom} • {story.pairing}
            </p>
          </div>
          <span className="rounded-full bg-[var(--plotty-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--plotty-accent)]">
            Сводка для читателя
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold text-[var(--plotty-muted)]">
          <span className="rounded-full bg-[var(--plotty-panel)] px-3 py-2">{story.rating}</span>
          <span className="rounded-full bg-[var(--plotty-panel)] px-3 py-2">{mapStoryStatusLabel(story.status)}</span>
          <span className="rounded-full bg-[var(--plotty-panel)] px-3 py-2">{story.chapters} глав</span>
          <span className="rounded-full bg-[var(--plotty-panel)] px-3 py-2">{mapStorySizeLabel(story.size)}</span>
        </div>

        <p className="text-sm leading-7 text-[var(--plotty-muted)]">{story.excerpt}</p>

        <div className="flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--plotty-line)] bg-white/70 px-3 py-2 text-xs font-bold text-[var(--plotty-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--plotty-muted)]">
          <div className="flex flex-wrap gap-3">
            <span>❤ {story.likes.toLocaleString("ru-RU")}</span>
            <span>💬 {story.comments.toLocaleString("ru-RU")}</span>
            <span>🔖 {story.bookmarks.toLocaleString("ru-RU")}</span>
            <span>{story.updatedLabel}</span>
          </div>
          {story.authorAiHint ? (
            <span className="rounded-full bg-[var(--plotty-olive-soft)] px-3 py-1.5 text-xs font-bold text-[var(--plotty-olive)]">
              {story.authorAiHint}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

