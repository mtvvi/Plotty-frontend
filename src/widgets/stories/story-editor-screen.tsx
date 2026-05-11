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
};

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

  useEffect(() => {
    if (!chapterQuery.data) {
      return;
    }

    setValues({
      chapterTitle: getEditableChapterTitle(chapterQuery.data),
      chapterContent: getEditableChapterContent(chapterQuery.data),
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
  }, [chapterId]);

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

  const spellcheckHighlights = useMemo(
    () =>
      buildSpellcheckHighlights(
        values.chapterContent,
        spellcheckJobQuery.data?.result?.items ?? [],
        appliedSpellcheckFixes,
      ),
    [appliedSpellcheckFixes, spellcheckJobQuery.data?.result?.items, values.chapterContent],
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

    try {
      const accepted = await spellcheckMutation.mutateAsync({
        chapterId,
        content: values.chapterContent,
      });

      setAppliedSpellcheckFixes([]);
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

    const range = resolveSpellcheckIssueRange(values.chapterContent, issue);

    if (!range) {
      return false;
    }

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

      return [...current, { key: issueKey }];
    });

    return true;
  }

  async function handleLogicCheck() {
    setAiCreditError("");

    try {
      const accepted = await logicCheckMutation.mutateAsync({
        chapterId,
        content: values.chapterContent,
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
        spellcheckResult={spellcheckJobQuery.data?.result}
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
        onChange={setValues}
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

    const range = resolveSpellcheckIssueRange(content, issue);

    if (!range) {
      return [];
    }

    return [
      {
        id: issueKey,
        startOffset: range.startIndex,
        endOffset: range.endIndex,
        tone: "warning" as const,
        data: issue,
      },
    ];
  });
}

function resolveSpellcheckIssueRange(content: string, issue: SpellcheckIssue): ResolvedTextRange | null {
  return resolveTextRangeByOffsets({
    text: content,
    startOffset: issue.startOffset,
    endOffset: issue.endOffset,
    fragmentText: issue.fragmentText,
  });
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
