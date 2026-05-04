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

  return findNearestFragment(text, fragmentText, codePointStart);
}

function findNearestFragment(text: string, fragmentText: string, preferredIndex: number): ResolvedTextRange | null {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  let cursor = 0;

  while (cursor <= text.length) {
    const index = text.indexOf(fragmentText, cursor);

    if (index === -1) {
      break;
    }

    const distance = Math.abs(index - preferredIndex);

    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }

    cursor = index + Math.max(fragmentText.length, 1);
  }

  if (bestIndex === -1) {
    return null;
  }

  return {
    startIndex: bestIndex,
    endIndex: bestIndex + fragmentText.length,
  };
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
