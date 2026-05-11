export interface ResolvedTextRange {
  startIndex: number;
  endIndex: number;
}

export function resolveTextRangeByOffsets({
  text,
  startOffset,
  endOffset,
  fragmentText,
}: {
  text: string;
  startOffset: number;
  endOffset: number;
  fragmentText: string;
}): ResolvedTextRange | null {
  if (!fragmentText || !fragmentText.trim()) {
    return null;
  }

  const directStart = clamp(startOffset, 0, text.length);
  const directEnd = clamp(endOffset, directStart, text.length);

  if (text.slice(directStart, directEnd) === fragmentText) {
    return { startIndex: directStart, endIndex: directEnd };
  }

  const codePointStart = codePointOffsetToCodeUnitIndex(text, startOffset);
  const codePointEnd = codePointOffsetToCodeUnitIndex(text, endOffset);

  if (text.slice(codePointStart, codePointEnd) === fragmentText) {
    return { startIndex: codePointStart, endIndex: codePointEnd };
  }

  return null;
}

function codePointOffsetToCodeUnitIndex(text: string, offset: number) {
  const targetOffset = Math.max(0, offset);
  let codePointOffset = 0;
  let codeUnitIndex = 0;

  while (codeUnitIndex < text.length && codePointOffset < targetOffset) {
    const codePoint = text.codePointAt(codeUnitIndex);
    codeUnitIndex += codePoint && codePoint > 0xffff ? 2 : 1;
    codePointOffset += 1;
  }

  return codeUnitIndex;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
