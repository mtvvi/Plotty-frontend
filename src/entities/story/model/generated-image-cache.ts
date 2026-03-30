const generatedImageStorageKey = "plotty.generated-images";
const generatedStoryCoverStorageKey = "plotty.generated-story-covers";

type GeneratedImageCache = Record<string, string>;

function readGeneratedImageCache(): GeneratedImageCache {
  return readCache(generatedImageStorageKey);
}

function readGeneratedStoryCoverCache(): GeneratedImageCache {
  return readCache(generatedStoryCoverStorageKey);
}

function readCache(storageKey: string): GeneratedImageCache {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    return raw ? (JSON.parse(raw) as GeneratedImageCache) : {};
  } catch {
    return {};
  }
}

export function getGeneratedImageUrl(chapterId: string) {
  return readGeneratedImageCache()[chapterId];
}

export function setGeneratedImageUrl(chapterId: string, imageUrl: string) {
  writeCache(generatedImageStorageKey, chapterId, imageUrl);
}

export function getGeneratedStoryCoverUrl(storySlug: string) {
  return readGeneratedStoryCoverCache()[storySlug];
}

export function setGeneratedStoryCoverUrl(storySlug: string, imageUrl: string) {
  writeCache(generatedStoryCoverStorageKey, storySlug, imageUrl);
}

function writeCache(storageKey: string, key: string, imageUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  const next = {
    ...readCache(storageKey),
    [key]: imageUrl,
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));
}
