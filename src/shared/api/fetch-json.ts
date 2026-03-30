function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveApiInput(input: string, directApiUrl = process.env.NEXT_PUBLIC_API_URL || "") {
  if (/^https?:\/\//.test(input)) {
    return input;
  }

  const path = input.startsWith("/") ? input : `/${input}`;
  const proxiedPath = path === "/api" ? path : path.startsWith("/api/") ? path : `/api${path}`;
  const backendPath = path === "/api" ? "/" : path.startsWith("/api/") ? path.slice(4) : path;

  if (directApiUrl) {
    return `${stripTrailingSlash(directApiUrl)}${backendPath}`;
  }

  return proxiedPath;
}

export async function fetchJson<T>(input: string, init?: RequestInit) {
  const url = resolveApiInput(input);

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();

  return (text ? (JSON.parse(text) as T) : (null as T));
}
