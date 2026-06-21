export function formatVisibleSpellcheckSummary(
  originalSummary: string,
  visibleCount: number,
  originalCount: number,
  dismissedCount = 0,
) {
  if (visibleCount === originalCount) {
    return originalSummary;
  }

  if (visibleCount > 0) {
    if (/^Найдено возможных ошибок:\s*\d+/i.test(originalSummary)) {
      return `Найдено возможных ошибок: ${visibleCount}`;
    }

    return formatFoundSpellcheckIssues(visibleCount);
  }

  return dismissedCount
    ? "Все найденные замечания обработаны."
    : "Все найденные замечания исправлены.";
}

function formatFoundSpellcheckIssues(count: number) {
  return `Найдено ${count} ${declineRemark(count)}`;
}

function declineRemark(count: number) {
  const mod100 = Math.abs(count) % 100;
  const mod10 = Math.abs(count) % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return "замечаний";
  }

  if (mod10 === 1) {
    return "замечание";
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return "замечания";
  }

  return "замечаний";
}
