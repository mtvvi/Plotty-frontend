function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function withoutIncompatibleAbortSignal(init: RequestInit): RequestInit {
  if (!init.signal) {
    return init;
  }

  try {
    new Request("http://localhost", { signal: init.signal });

    return init;
  } catch {
    const { signal: _signal, ...compatibleInit } = init;

    return compatibleInit;
  }
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: unknown;
  code?: string;
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
  const payloadMessage = getPayloadMessage(payload);

  if (payloadMessage) {
    return payloadMessage;
  }

  return `Request failed: ${status}`;
}

function getPayloadMessage(value: unknown, depth = 0): string | undefined {
  if (depth > 3) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed || undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = getPayloadMessage(item, depth + 1);

      if (message) {
        return message;
      }
    }

    return undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const payload = value as Record<string, unknown>;

  for (const key of ["error", "message", "detail", "msg"]) {
    const message = getPayloadMessage(payload[key], depth + 1);

    if (message) {
      return message;
    }
  }

  return undefined;
}

export async function fetchJson<T>(input: string, init?: RequestInit) {
  const url = resolveApiInput(input);
  const requestInit = withoutIncompatibleAbortSignal({
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const response = await fetch(url, requestInit);

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

export function isInsufficientCreditsError(error: unknown) {
  return isApiError(error) && error.status === 402;
}
