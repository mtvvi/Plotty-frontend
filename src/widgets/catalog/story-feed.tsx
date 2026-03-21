import type { CatalogStoryCard, CatalogView } from "@/entities/catalog/model/types";
import { EmptyState } from "@/shared/ui/empty-state";

import { StoryCard } from "./story-card";

interface StoryFeedProps {
  stories: CatalogStoryCard[];
  view: CatalogView;
  isFiltered: boolean;
  onReset: () => void;
}

export function StoryFeed({ stories, view, isFiltered, onReset }: StoryFeedProps) {
  if (!stories.length) {
    return (
      <EmptyState
        title={isFiltered ? "Ничего не найдено по этим фильтрам" : "Каталог пока пуст"}
        description={
          isFiltered
            ? "Сбрось часть фильтров или попробуй другой запрос. Контракт каталога уже готов, но выдача на моках специально ограничена."
            : "Как только появятся реальные данные, сюда встанет первая подборка историй."
        }
        actionLabel={isFiltered ? "Сбросить фильтры" : undefined}
        onAction={isFiltered ? onReset : undefined}
      />
    );
  }

  return (
    <div className={`grid gap-4 ${view === "tiles" ? "md:grid-cols-2" : ""}`}>
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} view={view} />
      ))}
    </div>
  );
}

