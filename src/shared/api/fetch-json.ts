function resolveApiInput(input: string) {
  if (/^https?:\/\//.test(input)) {
    return input;
  }

  const path = input.startsWith("/") ? input : `/${input}`;

  return path.startsWith("/api/") ? path : `/api${path}`;
}

export async function fetchJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(resolveApiInput(input), {
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
