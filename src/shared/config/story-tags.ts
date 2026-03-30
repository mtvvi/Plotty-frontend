import type { StoryTag } from "@/entities/story/model/types";

export const storyDirectionalityTags: StoryTag[] = [
  { id: "directionality-1", category: "directionality", slug: "harry-potter", name: "Гарри Поттер" },
  { id: "directionality-2", category: "directionality", slug: "witcher", name: "Ведьмак" },
  { id: "directionality-3", category: "directionality", slug: "lord-of-the-rings", name: "Властелин колец" },
  { id: "directionality-4", category: "directionality", slug: "naruto", name: "Наруто" },
  { id: "directionality-5", category: "directionality", slug: "marvel", name: "Марвел" },
  { id: "directionality-6", category: "directionality", slug: "dc", name: "DC" },
  { id: "directionality-7", category: "directionality", slug: "sherlock", name: "Шерлок" },
  { id: "directionality-8", category: "directionality", slug: "star-wars", name: "Звёздные войны" },
  { id: "directionality-9", category: "directionality", slug: "game-of-thrones", name: "Игра престолов" },
  { id: "directionality-10", category: "directionality", slug: "attack-on-titan", name: "Атака титанов" },
  { id: "directionality-11", category: "directionality", slug: "originals", name: "Ориджиналы" },
];

export const storyGenres: StoryTag[] = [
  { id: "genre-1", category: "genre", slug: "drama", name: "Драма" },
  { id: "genre-2", category: "genre", slug: "humor", name: "Юмор" },
  { id: "genre-3", category: "genre", slug: "mystery", name: "Мистика" },
  { id: "genre-4", category: "genre", slug: "slice-of-life", name: "Повседневность" },
  { id: "genre-5", category: "genre", slug: "fantasy", name: "Фэнтези" },
  { id: "genre-6", category: "genre", slug: "adventure", name: "Приключения" },
];

export const storyWarnings: StoryTag[] = [
  { id: "warning-1", category: "warning", slug: "character-death", name: "Смерть персонажа" },
  { id: "warning-2", category: "warning", slug: "violence", name: "Насилие" },
  { id: "warning-3", category: "warning", slug: "ooc", name: "OOC" },
  { id: "warning-4", category: "warning", slug: "profanity", name: "Нецензурная лексика" },
];

export const storyRatingTags: StoryTag[] = [
  { id: "rating-1", category: "rating", slug: "g", name: "G" },
  { id: "rating-2", category: "rating", slug: "pg-13", name: "PG-13" },
  { id: "rating-3", category: "rating", slug: "r", name: "R" },
  { id: "rating-4", category: "rating", slug: "nc-17", name: "NC-17" },
  { id: "rating-5", category: "rating", slug: "nc-21", name: "NC-21" },
];

export const storySizeTags: StoryTag[] = [
  { id: "size-1", category: "size", slug: "drabble", name: "Драббл" },
  { id: "size-2", category: "size", slug: "mini", name: "Мини" },
  { id: "size-3", category: "size", slug: "midi", name: "Миди" },
  { id: "size-4", category: "size", slug: "maxi", name: "Макси" },
];

export const storyCompletionTags: StoryTag[] = [
  { id: "completion-1", category: "completion", slug: "completed", name: "Завершён" },
  { id: "completion-2", category: "completion", slug: "in-progress", name: "В процессе" },
  { id: "completion-3", category: "completion", slug: "frozen", name: "Заморожен" },
];

export const storyTags: StoryTag[] = [
  ...storyDirectionalityTags,
  ...storyGenres,
  ...storyWarnings,
  ...storyRatingTags,
  ...storySizeTags,
  ...storyCompletionTags,
];

export const storyTagCategoryLabels: Record<string, string> = {
  directionality: "Фандом",
  genre: "Жанры",
  warning: "Предупреждения",
  rating: "Рейтинг",
  size: "Размер",
  completion: "Статус",
};

export const storyTagCategoryOrder = [
  "directionality",
  "rating",
  "completion",
  "size",
  "genre",
  "warning",
] as const;

export const singleSelectTagCategories = ["directionality", "rating", "completion", "size"] as const;

export function getStoryTagCategoryLabel(category: string) {
  return storyTagCategoryLabels[category] ?? category;
}

export function groupStoryTags(tags: StoryTag[]) {
  return tags.reduce<Record<string, StoryTag[]>>((groups, tag) => {
    const category = tag.category ?? "other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(tag);

    return groups;
  }, {});
}
