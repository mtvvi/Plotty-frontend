import { ApiError } from "@/shared/api/fetch-json";

const technicalErrorPatterns = [
  "failed",
  "error",
  "exception",
  "timeout",
  "network",
  "server",
  "unauthorized",
  "forbidden",
  "not found",
  "request failed",
  "image gen",
  "generation",
];

export function sanitizeUserFacingMessage(message: string | undefined | null, fallback: string) {
  const trimmed = message?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (/[А-Яа-яЁё]/.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();

  if (technicalErrorPatterns.some((pattern) => normalized.includes(pattern))) {
    return fallback;
  }

  return fallback;
}

export function toUserFacingErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return sanitizeUserFacingMessage(error.message, fallback);
  }

  if (error instanceof Error) {
    return sanitizeUserFacingMessage(error.message, fallback);
  }

  return fallback;
}
