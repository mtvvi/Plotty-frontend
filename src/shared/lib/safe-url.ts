const appUrlBase = "https://plotty.local";
const allowedImageProtocols = new Set(["http:", "https:", "blob:"]);

export function sanitizeInternalNextUrl(value: string | null | undefined, fallback: string) {
  const candidate = value?.trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, appUrlBase);

    if (url.origin !== appUrlBase) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function sanitizeImageUrl(value: string | null | undefined) {
  const candidate = value?.trim();

  if (!candidate) {
    return undefined;
  }

  if (candidate.startsWith("/")) {
    return candidate.startsWith("//") || candidate.startsWith("/\\") ? undefined : candidate;
  }

  if (/^data:image\/(?:avif|gif|jpeg|jpg|png|svg\+xml|webp)(?:;|,)/i.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);

    return allowedImageProtocols.has(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function isUnoptimizedImageUrl(value: string) {
  return value.startsWith("data:") || value.startsWith("blob:");
}
