import { describe, expect, it } from "vitest";

import { resolveTextRangeByOffsets } from "@/shared/lib/text-ranges";

describe("resolveTextRangeByOffsets", () => {
  it("resolves matching UTF-16 offsets", () => {
    expect(
      resolveTextRangeByOffsets({
        text: "Первое слово и второе",
        startOffset: 7,
        endOffset: 12,
        fragmentText: "слово",
      }),
    ).toEqual({ startIndex: 7, endIndex: 12 });
  });

  it("resolves backend code point offsets for astral symbols", () => {
    expect(
      resolveTextRangeByOffsets({
        text: "До 😀 ошибка",
        startOffset: 5,
        endOffset: 11,
        fragmentText: "ошибка",
      }),
    ).toEqual({ startIndex: 6, endIndex: 12 });
  });

  it("does not resolve stale offsets by searching for a nearby matching fragment", () => {
    expect(
      resolveTextRangeByOffsets({
        text: "Первое слово уже исправлено. Второе слово осталось.",
        startOffset: 29,
        endOffset: 34,
        fragmentText: "слово",
      }),
    ).toBeNull();
  });
});
