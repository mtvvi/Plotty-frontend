import type { StoryTag } from "@/entities/story/model/types";

export const storyFandoms = [
  "Гарри Поттер",
  "Ведьмак",
  "Властелин Колец",
  "Наруто",
] as const;

export const storyGenres: StoryTag[] = [
  { id: "genre-1", slug: "drama", name: "драма" },
  { id: "genre-2", slug: "humor", name: "юмор" },
  { id: "genre-3", slug: "mysticism", name: "мистика" },
  { id: "genre-4", slug: "slice-of-life", name: "повседневность" },
  { id: "genre-5", slug: "fantasy", name: "фэнтези" },
  { id: "genre-6", slug: "adventure", name: "приключения" },
];

export const storyWarnings: StoryTag[] = [
  { id: "warning-1", slug: "character-death", name: "смерть персонажа" },
  { id: "warning-2", slug: "violence", name: "насилие" },
  { id: "warning-3", slug: "ooc", name: "OOC" },
  { id: "warning-4", slug: "profanity", name: "нецензурная лексика" },
];

export const storyTags: StoryTag[] = [...storyGenres, ...storyWarnings];

export const storyRatings = ["G", "PG-13", "R", "NC-17", "NC-21"] as const;

export const storySizes = ["драббл", "мини", "миди", "макси"] as const;

export const storyStatuses = ["завершён", "в процессе", "заморожен"] as const;
