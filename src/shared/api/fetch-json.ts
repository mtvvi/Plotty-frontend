function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  error?: string;
  errors?: ApiFieldError[];
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorPayload | string;

  constructor(message: string, status: number, data?: ApiErrorPayload | string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function resolveApiInput(input: string, directApiUrl = process.env.NEXT_PUBLIC_API_URL || "") {
  if (/^https?:\/\//.test(input)) {
    return input;
  }

  const path = input.startsWith("/") ? input : `/${input}`;
  const proxiedPath = path === "/api" ? path : path.startsWith("/api/") ? path : `/api${path}`;
  const backendPath = path === "/api" ? "/" : path.startsWith("/api/") ? path.slice(4) : path;

  if (directApiUrl) {
    const base = stripTrailingSlash(directApiUrl);

    try {
      const url = new URL(base);
      const normalizedPathname = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
      const apiBase = normalizedPathname.endsWith("/api") ? base : `${base}/api`;

      return `${stripTrailingSlash(apiBase)}${backendPath}`;
    } catch {
      return `${base}${backendPath}`;
    }
  }

  return proxiedPath;
}

async function readErrorPayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as ApiErrorPayload;
  } catch {
    return text;
  }
}

function getErrorMessage(status: number, payload?: ApiErrorPayload | string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    return payload.error;
  }

  return `Request failed: ${status}`;
}

export async function fetchJson<T>(input: string, init?: RequestInit) {
  const url = resolveApiInput(input);

  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);

    throw new ApiError(getErrorMessage(response.status, payload), response.status, payload);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();

  return (text ? (JSON.parse(text) as T) : (null as T));
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: unknown) {
  return isApiError(error) && (error.status === 401 || error.status === 403);
}
