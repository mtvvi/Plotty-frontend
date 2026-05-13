"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { creditBalanceQueryOptions, creditsKeys } from "@/entities/credits/api/credits-api";
import { AI_CREDIT_COSTS, formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import {
  aiJobQueryOptions,
  chapterEditorDetailsQueryOptions,
  createChapter,
  deleteChapter,
  publishChapter,
  startCanonCheck,
  startLogicCheck,
  startSpellcheck,
  storyKeys,
  updateChapter,
} from "@/entities/story/api/stories-api";
import type { CanonCheckResult, ChapterDetails, LogicCheckResult, SpellcheckIssue, SpellcheckResult } from "@/entities/story/model/types";
import { isApiError, isAuthError, isInsufficientCreditsError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { diffWords } from "@/shared/lib/text-diff";
import { resolveTextRangeByOffsets, type ResolvedTextRange } from "@/shared/lib/text-ranges";
import { EmptyState } from "@/shared/ui/empty-state";
import type { HighlightRange } from "@/shared/ui/highlighted-textarea";

import { ChapterImageFrame } from "./chapter-image-frame";
import { GenerateChapterImageButton } from "./generate-chapter-image-button";
import { PlottyShell } from "./plotty-shell";
import { StoryEditorForm, type StoryEditorValues } from "./story-editor-form";

const emptyValues: StoryEditorValues = {
  chapterTitle: "",
  chapterContent: "",
};

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

type AppliedSpellcheckFix = {
  key: string;
  delta: number;
  endOffset: number;
  startOffset: number;
};

type StoredSpellcheckState = {
  appliedFixes: AppliedSpellcheckFix[];
  contentHash: string;
  result: SpellcheckResult;
  savedAt: number;
  version: 1;
};

const SPELLCHECK_STORAGE_PREFIX = "plotty:chapter-spellcheck:";
const SPELLCHECK_STORAGE_VERSION = 1;

function getSpellcheckIssueKey(issue: SpellcheckIssue) {
  return `${issue.startOffset}-${issue.endOffset}-${issue.fragmentText}-${issue.suggestion}`;
}

export function StoryEditorScreen({
  storyId,
  chapterId,
}: {
  storyId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const chapterQuery = useQuery(chapterEditorDetailsQueryOptions(storyId, chapterId));
  const creditBalanceQuery = useQuery(creditBalanceQueryOptions());
  const [values, setValues] = useState<StoryEditorValues>(emptyValues);
  const [spellcheckJobId, setSpellcheckJobId] = useState("");
  const [logicCheckJobId, setLogicCheckJobId] = useState("");
  const [canonCheckJobId, setCanonCheckJobId] = useState("");
  const [canonCheckError, setCanonCheckError] = useState("");
  const [aiCreditError, setAiCreditError] = useState("");
  const [isPreparingCanonCheck, setIsPreparingCanonCheck] = useState(false);
  const [appliedSpellcheckFixes, setAppliedSpellcheckFixes] = useState<AppliedSpellcheckFix[]>([]);
  const [storedSpellcheckState, setStoredSpellcheckState] = useState<StoredSpellcheckState | null>(null);
  const [spellcheckContentSnapshot, setSpellcheckContentSnapshot] = useState("");

  useEffect(() => {
    if (!chapterQuery.data) {
      return;
    }

    setValues({
      chapterTitle: getEditableChapterTitle(chapterQuery.data),
      chapterContent: normalizeEditorText(getEditableChapterContent(chapterQuery.data)),
    });
  }, [chapterQuery.data]);

  useEffect(() => {
    setSpellcheckJobId("");
    setLogicCheckJobId("");
    setCanonCheckJobId("");
    setCanonCheckError("");
    setAiCreditError("");
    setIsPreparingCanonCheck(false);
    setAppliedSpellcheckFixes([]);
    setStoredSpellcheckState(null);
    setSpellcheckContentSnapshot("");
  }, [chapterId]);

  useEffect(() => {
    const stored = readStoredSpellcheckState(chapterId);
    const content = chapterQuery.data ? getEditableChapterContent(chapterQuery.data) : "";

    setStoredSpellcheckState(stored);
    setAppliedSpellcheckFixes(getStoredAppliedFixesForContent(stored, content));
  }, [chapterId, chapterQuery.data]);

  useEffect(() => {
    function syncStoredSpellcheckState() {
      const stored = readStoredSpellcheckState(chapterId);

      setStoredSpellcheckState(stored);
      setAppliedSpellcheckFixes(getStoredAppliedFixesForContent(stored, values.chapterContent));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === getSpellcheckStorageKey(chapterId)) {
        syncStoredSpellcheckState();
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        syncStoredSpellcheckState();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncStoredSpellcheckState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncStoredSpellcheckState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [chapterId, values.chapterContent]);

  const updateChapterMutation = useMutation({
    mutationFn: ({ targetChapterId, targetPayload }: { targetChapterId: string; targetPayload: StoryEditorValues }) =>
      updateChapter(targetChapterId, {
        title: targetPayload.chapterTitle.trim(),
        content: targetPayload.chapterContent.trim(),
        draftTitle: targetPayload.chapterTitle.trim(),
        draftContent: targetPayload.chapterContent.trim(),
      }),
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ nextStoryId, nextTitle }: { nextStoryId: string; nextTitle: string }) =>
      createChapter(nextStoryId, { title: nextTitle, content: emptyChapterDraft }),
  });
  const deleteChapterMutation = useMutation({
    mutationFn: deleteChapter,
  });
  const publishChapterMutation = useMutation({
    mutationFn: publishChapter,
  });
  const spellcheckMutation = useMutation({
    mutationFn: startSpellcheck,
  });
  const logicCheckMutation = useMutation({
    mutationFn: startLogicCheck,
  });
  const canonCheckMutation = useMutation({
    mutationFn: startCanonCheck,
  });

  const spellcheckJobQuery = useQuery({
    ...aiJobQueryOptions<SpellcheckResult>(spellcheckJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  const logicCheckJobQuery = useQuery({
    ...aiJobQueryOptions<LogicCheckResult>(logicCheckJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  const canonCheckJobQuery = useQuery({
    ...aiJobQueryOptions<CanonCheckResult>(canonCheckJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });
  const latestSpellcheckResult =
    spellcheckJobQuery.data?.status === "completed" ? spellcheckJobQuery.data.result : undefined;
  const activeSpellcheckResult = latestSpellcheckResult ?? storedSpellcheckState?.result;

  useEffect(() => {
    if (!latestSpellcheckResult) {
      return;
    }

    const stored = writeStoredSpellcheckState({
      appliedFixes: [],
      chapterId,
      content: spellcheckContentSnapshot || values.chapterContent,
      result: latestSpellcheckResult,
    });

    setStoredSpellcheckState(stored);
    setAppliedSpellcheckFixes([]);
  }, [chapterId, latestSpellcheckResult, spellcheckContentSnapshot, values.chapterContent]);

  const spellcheckHighlights = useMemo(
    () =>
      buildSpellcheckHighlights(
        values.chapterContent,
        activeSpellcheckResult?.items ?? [],
        appliedSpellcheckFixes,
      ),
    [activeSpellcheckResult?.items, appliedSpellcheckFixes, values.chapterContent],
  );
  const visibleSpellcheckResult = useMemo(
    () => getVisibleSpellcheckResult(activeSpellcheckResult, appliedSpellcheckFixes),
    [activeSpellcheckResult, appliedSpellcheckFixes],
  );
  const publishedTitle =
    chapterQuery.data?.publishedTitle ??
    (chapterQuery.data?.status === "published" ? chapterQuery.data.title : null);
  const publishedContent =
    chapterQuery.data?.publishedContent ??
    (chapterQuery.data?.status === "published" ? chapterQuery.data.content : null);
  const hasPublishedVersion = typeof publishedContent === "string";
  const hasLocalUnpublishedChanges =
    hasPublishedVersion &&
    (values.chapterTitle !== publishedTitle || values.chapterContent !== publishedContent);
  const hasUnpublishedChanges = Boolean(chapterQuery.data?.hasUnpublishedChanges || hasLocalUnpublishedChanges);
  const savedDraftTitle = chapterQuery.data ? getEditableChapterTitle(chapterQuery.data) : "";
  const savedDraftContent = chapterQuery.data ? getEditableChapterContent(chapterQuery.data) : "";
  const hasUnsavedDraftChanges = Boolean(
    chapterQuery.data &&
      (values.chapterTitle.trim() !== savedDraftTitle.trim() || values.chapterContent.trim() !== savedDraftContent.trim()),
  );
  const publicationDiff = useMemo(
    () =>
      hasPublishedVersion
        ? {
            title: diffWords(publishedTitle ?? "", values.chapterTitle),
            content: diffWords(publishedContent ?? "", values.chapterContent),
          }
        : undefined,
    [hasPublishedVersion, publishedContent, publishedTitle, values.chapterContent, values.chapterTitle],
  );

  async function persistCurrentDraft() {
    await updateChapterMutation.mutateAsync({
      targetChapterId: chapterId,
      targetPayload: values,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    await queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
    await queryClient.invalidateQueries({ queryKey: storyKeys.chapterEditor(storyId, chapterId) });

    if (chapterQuery.data?.storySlug) {
      await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapterQuery.data.storySlug) });
    }
  }

  async function handleSave() {
    try {
      await persistCurrentDraft();
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
    }
  }

  async function handleCreateNextChapter() {
    if (!chapterQuery.data) {
      return;
    }

    try {
      const nextNumber = (chapterQuery.data.storyChapters?.at(-1)?.number ?? 0) + 1;
      const chapter = await createChapterMutation.mutateAsync({
        nextStoryId: storyId,
        nextTitle: `Глава ${nextNumber}`,
      });

      if (chapterQuery.data.storySlug) {
        await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapterQuery.data.storySlug) });
      }

      router.push(routes.chapterEditor(storyId, chapter.id));
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
    }
  }

  async function handleDeleteChapter() {
    if (!window.confirm("Удалить эту главу?")) {
      return;
    }

    try {
      await deleteChapterMutation.mutateAsync(chapterId);
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
      return;
    }

    if (chapterQuery.data?.storySlug) {
      router.push(routes.story(chapterQuery.data.storySlug));
      return;
    }

    router.push(routes.write);
  }

  async function handleSpellcheck() {
    setAiCreditError("");
    const contentSnapshot = normalizeEditorText(values.chapterContent);

    try {
      const accepted = await spellcheckMutation.mutateAsync({
        chapterId,
        content: contentSnapshot,
      });

      setAppliedSpellcheckFixes([]);
      setSpellcheckContentSnapshot(contentSnapshot);
      setSpellcheckJobId(accepted.jobId);
      await queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
        return;
      }

      if (isInsufficientCreditsError(error)) {
        setAiCreditError(getInsufficientCreditsMessage(AI_CREDIT_COSTS.spellcheck, creditBalanceQuery.data?.balance));
        return;
      }

      setAiCreditError("Не удалось запустить проверку орфографии. Попробуйте ещё раз.");
    }
  }

  function handleApplySpellcheckIssue(issue: SpellcheckIssue) {
    const issueKey = getSpellcheckIssueKey(issue);

    if (appliedSpellcheckFixes.some((fix) => fix.key === issueKey)) {
      return false;
    }

    const range = resolveSpellcheckIssueRange(values.chapterContent, issue, appliedSpellcheckFixes);

    if (!range) {
      return false;
    }

    const delta = issue.suggestion.length - (range.endIndex - range.startIndex);
    const nextContent =
      values.chapterContent.slice(0, range.startIndex) + issue.suggestion + values.chapterContent.slice(range.endIndex);

    setValues((current) => ({
      ...current,
      chapterContent:
        current.chapterContent.slice(0, range.startIndex) +
        issue.suggestion +
        current.chapterContent.slice(range.endIndex),
    }));
    setAppliedSpellcheckFixes((current) => {
      if (current.some((fix) => fix.key === issueKey)) {
        return current;
      }

      const nextFixes = [
        ...current,
        {
          key: issueKey,
          delta,
          endOffset: issue.endOffset,
          startOffset: issue.startOffset,
        },
      ];

      if (activeSpellcheckResult) {
        const stored = writeStoredSpellcheckState({
          appliedFixes: nextFixes,
          chapterId,
          content: nextContent,
          result: activeSpellcheckResult,
        });

        setStoredSpellcheckState(stored);
      }

      return nextFixes;
    });

    return true;
  }

  async function handleLogicCheck() {
    setAiCreditError("");

    try {
      const accepted = await logicCheckMutation.mutateAsync({
        chapterId,
        content: normalizeEditorText(values.chapterContent),
      });

      setLogicCheckJobId(accepted.jobId);
      await queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
        return;
      }

      if (isInsufficientCreditsError(error)) {
        setAiCreditError(getInsufficientCreditsMessage(AI_CREDIT_COSTS.logicCheck, creditBalanceQuery.data?.balance));
        return;
      }

      setAiCreditError("Не удалось запустить проверку логики. Попробуйте ещё раз.");
    }
  }

  async function handleCanonCheck() {
    setCanonCheckError("");
    setCanonCheckJobId("");
    setAiCreditError("");
    setIsPreparingCanonCheck(true);

    try {
      if (hasUnsavedDraftChanges) {
        await persistCurrentDraft();
      }

      const accepted = await canonCheckMutation.mutateAsync(chapterId);

      setCanonCheckJobId(accepted.jobId);
      await queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
        return;
      }

      if (isInsufficientCreditsError(error)) {
        setAiCreditError(getInsufficientCreditsMessage(AI_CREDIT_COSTS.canonCheck, creditBalanceQuery.data?.balance));
        return;
      }

      setCanonCheckError(getCanonCheckErrorMessage(error));
    } finally {
      setIsPreparingCanonCheck(false);
    }
  }

  async function handlePublish() {
    try {
      await publishChapterMutation.mutateAsync(chapterId);

      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      await queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
      await queryClient.invalidateQueries({ queryKey: storyKeys.chapterEditor(storyId, chapterId) });

      if (chapterQuery.data?.storySlug) {
        await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapterQuery.data.storySlug) });
      }
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
    }
  }

  if (chapterQuery.isLoading) {
    return (
      <PlottyShell title="Редактор загружается" description="Подтягиваем историю и нужную главу.">
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  if (chapterQuery.isError || !chapterQuery.data) {
    return (
      <PlottyShell title="Глава не найдена" description="Эта глава недоступна для редактирования.">
        <EmptyState title="Глава не найдена" description="Вернитесь в каталог и выберите другую историю." />
      </PlottyShell>
    );
  }

  const aiStatusLabel =
    spellcheckJobQuery.data?.status === "processing" || spellcheckJobQuery.data?.status === "queued"
      ? "Наш бета-ридер работает над выявлением ошибок."
      : "";

  const logicStatusLabel =
    logicCheckJobQuery.data?.status === "processing" || logicCheckJobQuery.data?.status === "queued"
      ? "Проверяем причинно-следственные связи и внутренние нестыковки..."
      : "";

  const canonStatusLabel = canonCheckError
    ? canonCheckError
    : canonCheckJobQuery.data?.status === "failed"
      ? canonCheckJobQuery.data.errorMessage ?? "Проверка канона завершилась с ошибкой."
      : isPreparingCanonCheck
        ? "Сохраняем черновик перед проверкой канона..."
        : canonCheckJobQuery.data?.status === "processing" || canonCheckJobQuery.data?.status === "queued"
          ? "Сверяем текст с каноном и правилами мира..."
          : "";

  const isSpellcheckBusy =
    spellcheckMutation.isPending ||
    spellcheckJobQuery.data?.status === "queued" ||
    spellcheckJobQuery.data?.status === "processing";

  const isLogicCheckBusy =
    logicCheckMutation.isPending ||
    logicCheckJobQuery.data?.status === "queued" ||
    logicCheckJobQuery.data?.status === "processing";

  const isCanonCheckBusy =
    isPreparingCanonCheck ||
    canonCheckMutation.isPending ||
    canonCheckJobQuery.data?.status === "queued" ||
    canonCheckJobQuery.data?.status === "processing";

  return (
    <PlottyShell
      title={values.chapterTitle || chapterQuery.data.title}
      description={`Глава ${chapterQuery.data.number ?? "—"} истории ${chapterQuery.data.storyTitle ?? "без названия"}`}
    >
      <StoryEditorForm
        values={values}
        storyId={storyId}
        storySlug={chapterQuery.data.storySlug}
        chapterId={chapterId}
        chapterNumber={chapterQuery.data.number}
        chapters={chapterQuery.data.storyChapters}
        spellcheckResult={visibleSpellcheckResult}
        spellcheckHighlights={spellcheckHighlights}
        aiStatusLabel={aiStatusLabel}
        logicCheckResult={logicCheckJobQuery.data?.result}
        logicStatusLabel={logicStatusLabel}
        canonCheckResult={canonCheckJobQuery.data?.result}
        canonStatusLabel={canonStatusLabel}
        creditBalance={creditBalanceQuery.data?.balance}
        creditError={aiCreditError}
        isSaving={updateChapterMutation.isPending}
        isSpellchecking={isSpellcheckBusy}
        isLogicChecking={isLogicCheckBusy}
        isCanonChecking={isCanonCheckBusy}
        imagePanel={
          <div className="space-y-5">
            <div className="rounded-[26px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[var(--plotty-shadow-card)]">
              <div className="space-y-3">
                <div>
                  <div className="plotty-section-title">Иллюстрация главы</div>
                  <p className="plotty-meta">Сгенерируйте изображение для этой главы.</p>
                </div>
                <ChapterImageFrame title={values.chapterTitle || chapterQuery.data.title} imageUrl={chapterQuery.data.imageUrl} />
                <GenerateChapterImageButton
                  chapterId={chapterId}
                  chapterTitle={values.chapterTitle || chapterQuery.data.title}
                  storySlug={chapterQuery.data.storySlug ?? ""}
                  storyTitle={chapterQuery.data.storyTitle}
                />
              </div>
            </div>
          </div>
        }
        onChange={(next) => setValues({ ...next, chapterContent: normalizeEditorText(next.chapterContent) })}
        onSave={handleSave}
        onPublish={handlePublish}
        isPublishing={publishChapterMutation.isPending}
        hasPublishedVersion={hasPublishedVersion}
        hasUnpublishedChanges={hasUnpublishedChanges}
        publicationDiff={publicationDiff}
        onCreateNextChapter={handleCreateNextChapter}
        onDeleteChapter={handleDeleteChapter}
        onSpellcheck={handleSpellcheck}
        onLogicCheck={handleLogicCheck}
        onCanonCheck={handleCanonCheck}
        onApplySpellcheckIssue={handleApplySpellcheckIssue}
      />
    </PlottyShell>
  );
}

function getEditableChapterTitle(chapter: ChapterDetails) {
  return chapter.draftTitle ?? chapter.title;
}

function getEditableChapterContent(chapter: ChapterDetails) {
  return chapter.draftContent ?? chapter.content;
}

function buildSpellcheckHighlights(
  content: string,
  issues: SpellcheckIssue[],
  appliedFixes: AppliedSpellcheckFix[],
): HighlightRange<SpellcheckIssue>[] {
  const appliedIssueKeys = new Set(appliedFixes.map((fix) => fix.key));

  return issues.flatMap((issue) => {
    const issueKey = getSpellcheckIssueKey(issue);

    if (appliedIssueKeys.has(issueKey)) {
      return [];
    }

    const range = resolveSpellcheckIssueRange(content, issue, appliedFixes);

    if (!range) {
      return [];
    }

    return [
      {
        id: issueKey,
        startOffset: range.startIndex,
        endOffset: range.endIndex,
        expectedText: issue.fragmentText,
        tone: "warning" as const,
        data: issue,
      },
    ];
  });
}

function resolveSpellcheckIssueRange(
  content: string,
  issue: SpellcheckIssue,
  appliedFixes: AppliedSpellcheckFix[] = [],
): ResolvedTextRange | null {
  const adjustedOffsets = getAdjustedSpellcheckOffsets(issue, appliedFixes);

  if (!adjustedOffsets) {
    return null;
  }

  return resolveTextRangeByOffsets({
    text: content,
    startOffset: adjustedOffsets.startOffset,
    endOffset: adjustedOffsets.endOffset,
    fragmentText: issue.fragmentText,
  });
}

function getAdjustedSpellcheckOffsets(
  issue: SpellcheckIssue,
  appliedFixes: AppliedSpellcheckFix[],
): { startOffset: number; endOffset: number } | null {
  const issueKey = getSpellcheckIssueKey(issue);
  let offsetDelta = 0;

  for (const fix of appliedFixes) {
    if (fix.key === issueKey) {
      return null;
    }

    if (fix.endOffset <= issue.startOffset) {
      offsetDelta += fix.delta;
      continue;
    }

    if (fix.startOffset < issue.endOffset && fix.endOffset > issue.startOffset) {
      return null;
    }
  }

  return {
    startOffset: issue.startOffset + offsetDelta,
    endOffset: issue.endOffset + offsetDelta,
  };
}

function getVisibleSpellcheckResult(
  result: SpellcheckResult | undefined,
  appliedFixes: AppliedSpellcheckFix[],
): SpellcheckResult | undefined {
  if (!result) {
    return undefined;
  }

  const appliedIssueKeys = new Set(appliedFixes.map((fix) => fix.key));
  const items = result.items.filter((issue) => !appliedIssueKeys.has(getSpellcheckIssueKey(issue)));

  if (items.length === result.items.length) {
    return result;
  }

  return {
    ...result,
    items,
    summary: items.length ? result.summary : "Все найденные замечания исправлены.",
  };
}

function normalizeEditorText(text: string) {
  return text.replace(/\r\n?/g, "\n");
}

function getSpellcheckStorageKey(chapterId: string) {
  return `${SPELLCHECK_STORAGE_PREFIX}${chapterId}`;
}

function readStoredSpellcheckState(chapterId: string): StoredSpellcheckState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getSpellcheckStorageKey(chapterId));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredSpellcheckState>;

    if (!isStoredSpellcheckState(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSpellcheckState({
  appliedFixes,
  chapterId,
  content,
  result,
}: {
  appliedFixes: AppliedSpellcheckFix[];
  chapterId: string;
  content: string;
  result: SpellcheckResult;
}) {
  const stored: StoredSpellcheckState = {
    appliedFixes,
    contentHash: hashText(normalizeEditorText(content)),
    result,
    savedAt: Date.now(),
    version: SPELLCHECK_STORAGE_VERSION,
  };

  if (typeof window === "undefined") {
    return stored;
  }

  try {
    window.localStorage.setItem(getSpellcheckStorageKey(chapterId), JSON.stringify(stored));
  } catch {
    // Losing the cache must not block editing or applying a correction.
  }

  return stored;
}

function getStoredAppliedFixesForContent(stored: StoredSpellcheckState | null, content: string) {
  if (!stored || stored.contentHash !== hashText(normalizeEditorText(content))) {
    return [];
  }

  return stored.appliedFixes;
}

function isStoredSpellcheckState(value: Partial<StoredSpellcheckState>): value is StoredSpellcheckState {
  return (
    value.version === SPELLCHECK_STORAGE_VERSION &&
    typeof value.savedAt === "number" &&
    typeof value.contentHash === "string" &&
    Boolean(value.result) &&
    Array.isArray(value.result?.items) &&
    Array.isArray(value.appliedFixes)
  );
}

function hashText(text: string) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return `${text.length}:${hash >>> 0}`;
}

function getCanonCheckErrorMessage(error: unknown) {
  if (!isApiError(error)) {
    return "Не удалось запустить проверку канона. Попробуйте ещё раз.";
  }

  const rawMessage =
    typeof error.data === "object" && error.data && "error" in error.data && error.data.error
      ? error.data.error
      : error.message;
  const message = rawMessage.toLowerCase();

  if (message.includes("original") || message.includes("no fandom")) {
    return "Проверка канона доступна только для историй с фандомом.";
  }

  if (error.status === 404) {
    return "Маршрут проверки канона не найден на бэке.";
  }

  return rawMessage || "Не удалось запустить проверку канона. Попробуйте ещё раз.";
}

function getInsufficientCreditsMessage(requiredCredits: number, balance?: number) {
  const balanceText = typeof balance === "number" ? ` Сейчас на балансе ${formatCreditsAmount(balance)}.` : "";

  return `Недостаточно кредитов для запуска: нужно ${formatCreditsAmount(requiredCredits)}.${balanceText}`;
}
