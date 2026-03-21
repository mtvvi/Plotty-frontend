const generatedImageStorageKey = "plotty.generated-images";

type GeneratedImageCache = Record<string, string>;

function readGeneratedImageCache(): GeneratedImageCache {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(generatedImageStorageKey);

    return raw ? (JSON.parse(raw) as GeneratedImageCache) : {};
  } catch {
    return {};
  }
}

export function getGeneratedImageUrl(chapterId: string) {
  return readGeneratedImageCache()[chapterId];
}

export function setGeneratedImageUrl(chapterId: string, imageUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  const next = {
    ...readGeneratedImageCache(),
    [chapterId]: imageUrl,
  };

  window.localStorage.setItem(generatedImageStorageKey, JSON.stringify(next));
}
