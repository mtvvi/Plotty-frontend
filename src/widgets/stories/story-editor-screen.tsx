"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
import type { AiJobStatus, CanonCheckResult, ChapterDetails, LogicCheckResult, SpellcheckIssue, SpellcheckResult, StoryTag } from "@/entities/story/model/types";
import { isApiError, isAuthError, isInsufficientCreditsError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { diffWords } from "@/shared/lib/text-diff";
import { resolveTextRangeByOffsets, type ResolvedTextRange } from "@/shared/lib/text-ranges";
import { sanitizeUserFacingMessage } from "@/shared/lib/user-facing-error";
import { EmptyState } from "@/shared/ui/empty-state";
import type { HighlightRange } from "@/shared/ui/highlighted-textarea";
import type { AsyncJobStatusValue } from "@/shared/ui/motion";

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
  dismissedIssueKeys: string[];
  result: SpellcheckResult;
  savedAt: number;
  version: 1 | 2;
};

const SPELLCHECK_STORAGE_PREFIX = "plotty:chapter-spellcheck:";
const SPELLCHECK_STORAGE_VERSION = 2;

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
  const [dismissedSpellcheckIssueKeys, setDismissedSpellcheckIssueKeys] = useState<string[]>([]);
  const [storedSpellcheckState, setStoredSpellcheckState] = useState<StoredSpellcheckState | null>(null);
  const [spellcheckContentSnapshot, setSpellcheckContentSnapshot] = useState("");
  const [saveStatusMessage, setSaveStatusMessage] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

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
    setDismissedSpellcheckIssueKeys([]);
    setStoredSpellcheckState(null);
    setSpellcheckContentSnapshot("");
    setGeneratedImageUrl("");
  }, [chapterId]);

  useEffect(() => {
    const stored = readStoredSpellcheckState(chapterId);
    const content = chapterQuery.data ? getEditableChapterContent(chapterQuery.data) : "";

    setStoredSpellcheckState(stored);
    setAppliedSpellcheckFixes(getStoredAppliedFixesForContent(stored, content));
    setDismissedSpellcheckIssueKeys(getStoredDismissedIssueKeysForContent(stored, content));
  }, [chapterId, chapterQuery.data]);

  useEffect(() => {
    function syncStoredSpellcheckState() {
      const stored = readStoredSpellcheckState(chapterId);

      setStoredSpellcheckState(stored);
      setAppliedSpellcheckFixes(getStoredAppliedFixesForContent(stored, values.chapterContent));
      setDismissedSpellcheckIssueKeys(getStoredDismissedIssueKeysForContent(stored, values.chapterContent));
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
      dismissedIssueKeys: [],
      result: latestSpellcheckResult,
    });

    setStoredSpellcheckState(stored);
    setAppliedSpellcheckFixes([]);
    setDismissedSpellcheckIssueKeys([]);
  }, [chapterId, latestSpellcheckResult, spellcheckContentSnapshot, values.chapterContent]);

  const spellcheckHighlights = useMemo(
    () =>
      buildSpellcheckHighlights(
        values.chapterContent,
        activeSpellcheckResult?.items ?? [],
        appliedSpellcheckFixes,
        dismissedSpellcheckIssueKeys,
      ),
    [activeSpellcheckResult?.items, appliedSpellcheckFixes, dismissedSpellcheckIssueKeys, values.chapterContent],
  );
  const visibleSpellcheckResult = useMemo(
    () =>
      getVisibleSpellcheckResult(
        activeSpellcheckResult,
        values.chapterContent,
        appliedSpellcheckFixes,
        dismissedSpellcheckIssueKeys,
      ),
    [activeSpellcheckResult, appliedSpellcheckFixes, dismissedSpellcheckIssueKeys, values.chapterContent],
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
  const storyFandomTag = chapterQuery.data?.storyTags?.find((tag) => tag.category === "directionality");
  const logicDisabledReason =
    (chapterQuery.data?.number ?? 1) <= 1
      ? "Проверка логики доступна со второй главы: для первой главы нет предыдущего контекста."
      : undefined;
  const canonDisabledReason = getCanonCheckDisabledReason(storyFandomTag);

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
      setSaveStatusMessage("Черновик сохранён");
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
      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapterQuery.data.storySlug) });
      await queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
      await queryClient.invalidateQueries({ queryKey: storyKeys.chapterEditor(storyId, chapterId) });
      router.push(`${routes.write}?story=${encodeURIComponent(chapterQuery.data.storySlug)}#active-story`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    await queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
    await queryClient.invalidateQueries({ queryKey: storyKeys.chapterEditor(storyId, chapterId) });
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
      setDismissedSpellcheckIssueKeys([]);
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
          dismissedIssueKeys: dismissedSpellcheckIssueKeys,
          result: activeSpellcheckResult,
        });

        setStoredSpellcheckState(stored);
      }

      return nextFixes;
    });

    return true;
  }

  function handleDismissSpellcheckIssue(issue: SpellcheckIssue) {
    const issueKey = getSpellcheckIssueKey(issue);

    if (appliedSpellcheckFixes.some((fix) => fix.key === issueKey)) {
      return;
    }

    setDismissedSpellcheckIssueKeys((current) => {
      if (current.includes(issueKey)) {
        return current;
      }

      const nextIssueKeys = [...current, issueKey];

      if (activeSpellcheckResult) {
        const stored = writeStoredSpellcheckState({
          appliedFixes: appliedSpellcheckFixes,
          chapterId,
          content: values.chapterContent,
          dismissedIssueKeys: nextIssueKeys,
          result: activeSpellcheckResult,
        });

        setStoredSpellcheckState(stored);
      }

      return nextIssueKeys;
    });
  }

  async function handleLogicCheck() {
    if (logicDisabledReason) {
      return;
    }

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
    if (canonDisabledReason) {
      setCanonCheckError(canonDisabledReason);
      return;
    }

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
  const spellcheckStatus = getEditorAsyncStatus({
    isPending: spellcheckMutation.isPending,
    status: spellcheckJobQuery.data?.status,
    hasResult: Boolean(latestSpellcheckResult),
  });
  const logicCheckStatus = getEditorAsyncStatus({
    isPending: logicCheckMutation.isPending,
    status: logicCheckJobQuery.data?.status,
    hasResult: Boolean(logicCheckJobQuery.data?.result),
  });
  const canonCheckStatus = getEditorAsyncStatus({
    isPending: isPreparingCanonCheck || canonCheckMutation.isPending,
    status: canonCheckJobQuery.data?.status,
    hasResult: Boolean(canonCheckJobQuery.data?.result),
    hasError: Boolean(canonCheckError),
  });
  const spellcheckStatusError =
    spellcheckJobQuery.data?.status === "failed"
      ? sanitizeUserFacingMessage(
          spellcheckJobQuery.data.errorMessage ?? spellcheckJobQuery.data.error,
          "Проверка орфографии завершилась с ошибкой.",
        )
      : undefined;
  const logicStatusError =
    logicCheckJobQuery.data?.status === "failed"
      ? sanitizeUserFacingMessage(
          logicCheckJobQuery.data.errorMessage ?? logicCheckJobQuery.data.error,
          "Проверка логики завершилась с ошибкой.",
        )
      : undefined;
  const canonStatusError =
    canonCheckError ||
    (canonCheckJobQuery.data?.status === "failed" ? "Не удалось проверить канон" : undefined);
  const displayImageUrl = generatedImageUrl || chapterQuery.data.imageUrl;

  return (
    <PlottyShell
      title={
        chapterQuery.data.storySlug ? (
          <span className="plotty-page-title-row">
            <Link
              href={`${routes.write}?story=${encodeURIComponent(chapterQuery.data.storySlug)}#active-story`}
              prefetch={false}
              className="plotty-story-title-anchor plotty-story-title-inline-anchor group text-[var(--plotty-ink)] transition-colors hover:text-[var(--plotty-accent)] focus-visible:text-[var(--plotty-accent)]"
            >
              <ArrowLeft className="plotty-page-title-back-icon size-8 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
              <span className="plotty-story-title-text text-[2rem]">
                {chapterQuery.data.storyTitle ?? "История"}
              </span>
            </Link>
            <span className="plotty-page-title-part text-[2rem]">{`• Глава ${chapterQuery.data.number ?? "—"}`}</span>
          </span>
        ) : (
          values.chapterTitle || chapterQuery.data.title
        )
      }
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
        spellcheckStatus={spellcheckStatus}
        spellcheckStatusError={spellcheckStatusError}
        logicCheckResult={logicCheckJobQuery.data?.result}
        logicStatusLabel={logicStatusLabel}
        logicCheckStatus={logicCheckStatus}
        logicStatusError={logicStatusError}
        logicDisabledReason={logicDisabledReason}
        canonCheckResult={canonCheckJobQuery.data?.result}
        canonCheckStatus={canonCheckStatus}
        canonStatusError={canonStatusError}
        canonDisabledReason={canonDisabledReason}
        creditBalance={creditBalanceQuery.data?.balance}
        creditError={aiCreditError}
        saveStatusMessage={saveStatusMessage}
        isSaving={updateChapterMutation.isPending}
        isSpellchecking={isSpellcheckBusy}
        isLogicChecking={isLogicCheckBusy}
        isCanonChecking={isCanonCheckBusy}
        imagePanel={
          <div className="space-y-5">
            <div className="plotty-lift-panel rounded-[26px] border border-[var(--plotty-line)] bg-[var(--plotty-surface)] p-4 shadow-[var(--plotty-shadow-card)]">
              <div className="space-y-3">
                <div>
                  <div className="plotty-section-title">Иллюстрация главы</div>
                </div>
                <ChapterImageFrame title={values.chapterTitle || chapterQuery.data.title} imageUrl={displayImageUrl} />
                <GenerateChapterImageButton
                  chapterId={chapterId}
                  storyId={storyId}
                  chapterTitle={values.chapterTitle || chapterQuery.data.title}
                  chapterContent={values.chapterContent}
                  storySlug={chapterQuery.data.storySlug ?? ""}
                  storyTitle={chapterQuery.data.storyTitle}
                  hasImage={Boolean(displayImageUrl)}
                  onImageGenerated={setGeneratedImageUrl}
                />
              </div>
            </div>
          </div>
        }
        onChange={(next) => {
          setSaveStatusMessage("");
          setValues({ ...next, chapterContent: normalizeEditorText(next.chapterContent) });
        }}
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
        onDismissSpellcheckIssue={handleDismissSpellcheckIssue}
      />
    </PlottyShell>
  );
}

function getEditableChapterTitle(chapter: ChapterDetails) {
  return chapter.draftTitle ?? chapter.title;
}

function getEditorAsyncStatus({
  isPending,
  status,
  hasResult,
  hasError = false,
}: {
  isPending: boolean;
  status?: AiJobStatus;
  hasResult: boolean;
  hasError?: boolean;
}): AsyncJobStatusValue {
  if (hasError || status === "failed") {
    return "failed";
  }

  if (isPending) {
    return "queued";
  }

  if (status === "queued" || status === "processing") {
    return status;
  }

  if (status === "completed" && hasResult) {
    return "completed";
  }

  return "idle";
}

function getEditableChapterContent(chapter: ChapterDetails) {
  return chapter.draftContent ?? chapter.content;
}

function buildSpellcheckHighlights(
  content: string,
  issues: SpellcheckIssue[],
  appliedFixes: AppliedSpellcheckFix[],
  dismissedIssueKeys: string[] = [],
): HighlightRange<SpellcheckIssue>[] {
  const appliedIssueKeys = new Set(appliedFixes.map((fix) => fix.key));
  const dismissedIssueKeySet = new Set(dismissedIssueKeys);

  return issues.flatMap((issue) => {
    const issueKey = getSpellcheckIssueKey(issue);

    if (appliedIssueKeys.has(issueKey) || dismissedIssueKeySet.has(issueKey)) {
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
  content: string,
  appliedFixes: AppliedSpellcheckFix[],
  dismissedIssueKeys: string[] = [],
): SpellcheckResult | undefined {
  if (!result) {
    return undefined;
  }

  const hiddenIssueKeys = new Set([...appliedFixes.map((fix) => fix.key), ...dismissedIssueKeys]);
  const items = result.items.filter((issue) => {
    const issueKey = getSpellcheckIssueKey(issue);

    if (hiddenIssueKeys.has(issueKey)) {
      return false;
    }

    return Boolean(resolveSpellcheckIssueRange(content, issue, appliedFixes));
  });

  if (items.length === result.items.length) {
    return result;
  }

  return {
    ...result,
    items,
    summary: items.length
      ? result.summary
      : dismissedIssueKeys.length
        ? "Все найденные замечания обработаны."
        : "Все найденные замечания исправлены.",
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

    return {
      ...parsed,
      dismissedIssueKeys: Array.isArray(parsed.dismissedIssueKeys)
        ? parsed.dismissedIssueKeys.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function writeStoredSpellcheckState({
  appliedFixes,
  chapterId,
  content,
  dismissedIssueKeys,
  result,
}: {
  appliedFixes: AppliedSpellcheckFix[];
  chapterId: string;
  content: string;
  dismissedIssueKeys: string[];
  result: SpellcheckResult;
}) {
  const stored: StoredSpellcheckState = {
    appliedFixes,
    contentHash: hashText(normalizeEditorText(content)),
    dismissedIssueKeys,
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

function getStoredDismissedIssueKeysForContent(stored: StoredSpellcheckState | null, content: string) {
  if (!stored || stored.contentHash !== hashText(normalizeEditorText(content))) {
    return [];
  }

  return stored.dismissedIssueKeys;
}

function isStoredSpellcheckState(value: Partial<StoredSpellcheckState>): value is StoredSpellcheckState {
  return (
    (value.version === 1 || value.version === SPELLCHECK_STORAGE_VERSION) &&
    typeof value.savedAt === "number" &&
    typeof value.contentHash === "string" &&
    Boolean(value.result) &&
    Array.isArray(value.result?.items) &&
    Array.isArray(value.appliedFixes) &&
    (value.version === 1 || Array.isArray(value.dismissedIssueKeys))
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
    return "Не удалось проверить канон";
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

  return sanitizeUserFacingMessage(rawMessage, "Не удалось проверить канон");
}

function getCanonCheckDisabledReason(fandomTag?: StoryTag) {
  if (!fandomTag) {
    return "Проверка канона доступна только для историй с выбранным фандомом. Добавьте фандом в настройках истории, чтобы запустить проверку.";
  }

  if (fandomTag.slug === "originals") {
    return "Проверка канона отключена для ориджиналов: у оригинальной истории нет внешнего фандома для сверки.";
  }

  return undefined;
}

function getInsufficientCreditsMessage(requiredCredits: number, balance?: number) {
  const balanceText = typeof balance === "number" ? ` Сейчас на балансе ${formatCreditsAmount(balance)}.` : "";

  return `Недостаточно кредитов для запуска: нужно ${formatCreditsAmount(requiredCredits)}.${balanceText}`;
}
