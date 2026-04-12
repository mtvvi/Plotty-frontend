"use client";

const storyTextStorageKey = "plotty.story-text-overrides";

type StoryTextOverride = {
  description?: string;
};

type StoryTextCache = Record<string, StoryTextOverride>;

function readStoryTextCache(): StoryTextCache {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storyTextStorageKey);

    return raw ? (JSON.parse(raw) as StoryTextCache) : {};
  } catch {
    return {};
  }
}

export function getStoryTextOverride(storyId: string) {
  return readStoryTextCache()[storyId];
}

export function setStoryTextOverride(storyId: string, override: StoryTextOverride) {
  if (typeof window === "undefined") {
    return;
  }

  const next = {
    ...readStoryTextCache(),
    [storyId]: override,
  };

  window.localStorage.setItem(storyTextStorageKey, JSON.stringify(next));
}
