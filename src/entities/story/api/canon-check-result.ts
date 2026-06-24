import type { CanonCheckIssue, CanonCheckResult } from "../model/types";

type RawRecord = Record<string, unknown>;

const itemArrayKeys = ["items", "issues", "contradictions", "violations", "problems", "findings"];
const messageKeys = ["message", "description", "text", "detail", "issue", "reason", "explanation", "summary"];
const detailKeys = ["canonFact", "canon", "chapterFragment", "fragment", "evidence", "suggestion", "recommendation", "source"];

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstString(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = toTrimmedString(record[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeIssue(value: unknown): CanonCheckIssue | undefined {
  if (typeof value === "string") {
    const message = value.trim();

    return message ? { message } : undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const message = getFirstString(value, messageKeys);

  if (!message) {
    return undefined;
  }

  const details = detailKeys
    .map((key) => toTrimmedString(value[key]))
    .filter((detail, index, detailsList) => detail && detail !== message && detailsList.indexOf(detail) === index);

  return details.length ? { message, details } : { message };
}

function collectIssues(value: unknown): CanonCheckIssue[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const issue = normalizeIssue(item);

      return issue ? [issue] : [];
    });
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of itemArrayKeys) {
    const issues = collectIssues(value[key]);

    if (issues.length) {
      return issues;
    }
  }

  return [];
}

function getResultMessage(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  return isRecord(value) ? getFirstString(value, ["message", "summary", "status"]) : "";
}

function isEmptyCanonMessage(message: string) {
  const lower = message.toLowerCase();

  return lower.includes("не найден") || lower.includes("не обнаруж") || lower.includes("нет противореч");
}

export function normalizeCanonCheckResult(value: unknown): CanonCheckResult {
  const items = collectIssues(value);
  const message = getResultMessage(value);

  if (items.length) {
    return {
      message: message && !isEmptyCanonMessage(message) ? message : "Противоречия с каноном:",
      items,
    };
  }

  return {
    message: message || "Противоречий с каноном не найдено.",
    items: [],
  };
}
