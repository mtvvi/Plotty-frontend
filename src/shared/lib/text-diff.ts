export type TextDiffPartType = "equal" | "added" | "removed";

export interface TextDiffPart {
  type: TextDiffPartType;
  value: string;
}

const maxDetailedTokens = 1200;

export function diffWords(previous: string, next: string): TextDiffPart[] {
  if (previous === next) {
    return previous ? [{ type: "equal", value: previous }] : [];
  }

  if (!previous) {
    return next ? [{ type: "added", value: next }] : [];
  }

  if (!next) {
    return previous ? [{ type: "removed", value: previous }] : [];
  }

  const previousTokens = tokenize(previous);
  const nextTokens = tokenize(next);

  if (previousTokens.length + nextTokens.length > maxDetailedTokens) {
    return coarseDiff(previous, next);
  }

  return mergeParts(buildTokenDiff(previousTokens, nextTokens));
}

function tokenize(value: string) {
  return value.match(/\s+|\S+/g) ?? [];
}

function buildTokenDiff(previousTokens: string[], nextTokens: string[]): TextDiffPart[] {
  const rows = previousTokens.length + 1;
  const cols = nextTokens.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = previousTokens.length - 1; row >= 0; row -= 1) {
    for (let col = nextTokens.length - 1; col >= 0; col -= 1) {
      matrix[row][col] =
        previousTokens[row] === nextTokens[col]
          ? matrix[row + 1][col + 1] + 1
          : Math.max(matrix[row + 1][col], matrix[row][col + 1]);
    }
  }

  const parts: TextDiffPart[] = [];
  let row = 0;
  let col = 0;

  while (row < previousTokens.length && col < nextTokens.length) {
    if (previousTokens[row] === nextTokens[col]) {
      parts.push({ type: "equal", value: previousTokens[row] });
      row += 1;
      col += 1;
    } else if (matrix[row + 1][col] >= matrix[row][col + 1]) {
      parts.push({ type: "removed", value: previousTokens[row] });
      row += 1;
    } else {
      parts.push({ type: "added", value: nextTokens[col] });
      col += 1;
    }
  }

  while (row < previousTokens.length) {
    parts.push({ type: "removed", value: previousTokens[row] });
    row += 1;
  }

  while (col < nextTokens.length) {
    parts.push({ type: "added", value: nextTokens[col] });
    col += 1;
  }

  return parts;
}

function coarseDiff(previous: string, next: string): TextDiffPart[] {
  let prefixLength = 0;
  const maxPrefixLength = Math.min(previous.length, next.length);

  while (prefixLength < maxPrefixLength && previous[prefixLength] === next[prefixLength]) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const maxSuffixLength = maxPrefixLength - prefixLength;

  while (
    suffixLength < maxSuffixLength &&
    previous[previous.length - suffixLength - 1] === next[next.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  return mergeParts([
    { type: "equal", value: previous.slice(0, prefixLength) },
    { type: "removed", value: previous.slice(prefixLength, previous.length - suffixLength) },
    { type: "added", value: next.slice(prefixLength, next.length - suffixLength) },
    { type: "equal", value: suffixLength ? previous.slice(previous.length - suffixLength) : "" },
  ]);
}

function mergeParts(parts: TextDiffPart[]) {
  const merged: TextDiffPart[] = [];

  parts.forEach((part) => {
    if (!part.value) {
      return;
    }

    const previous = merged.at(-1);

    if (previous?.type === part.type) {
      previous.value += part.value;
      return;
    }

    merged.push({ ...part });
  });

  return merged;
}
