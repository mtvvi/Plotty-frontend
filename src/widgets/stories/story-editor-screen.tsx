"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import type { CanonCheckResult, LogicCheckResult, SpellcheckIssue, SpellcheckResult } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";

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
  startOffset: number;
  delta: number;
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
  const [values, setValues] = useState<StoryEditorValues>(emptyValues);
  const [spellcheckJobId, setSpellcheckJobId] = useState("");
  const [logicCheckJobId, setLogicCheckJobId] = useState("");
  const [canonCheckJobId, setCanonCheckJobId] = useState("");
  const [appliedSpellcheckFixes, setAppliedSpellcheckFixes] = useState<AppliedSpellcheckFix[]>([]);
  const [chapterPublishedThisSession, setChapterPublishedThisSession] = useState(false);

  useEffect(() => {
    if (!chapterQuery.data) {
      return;
    }

    setValues({
      chapterTitle: chapterQuery.data.title,
      chapterContent: chapterQuery.data.content,
    });
  }, [chapterQuery.data]);

  useEffect(() => {
    setChapterPublishedThisSession(false);
    setSpellcheckJobId("");
    setLogicCheckJobId("");
    setCanonCheckJobId("");
    setAppliedSpellcheckFixes([]);
  }, [chapterId]);

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

  async function handleSave() {
    try {
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
    const accepted = await spellcheckMutation.mutateAsync({
      chapterId,
      content: values.chapterContent,
    });

    setAppliedSpellcheckFixes([]);
    setSpellcheckJobId(accepted.jobId);
  }

  function handleApplySpellcheckIssue(issue: SpellcheckIssue) {
    const issueKey = getSpellcheckIssueKey(issue);

    if (appliedSpellcheckFixes.some((fix) => fix.key === issueKey)) {
      return;
    }

    const offsetShift = appliedSpellcheckFixes.reduce(
      (total, fix) => (fix.startOffset < issue.startOffset ? total + fix.delta : total),
      0,
    );
    const adjustedStart = issue.startOffset + offsetShift;
    const adjustedEnd = adjustedStart + (issue.endOffset - issue.startOffset);

    if (values.chapterContent.slice(adjustedStart, adjustedEnd) !== issue.fragmentText) {
      return;
    }

    setValues({
      ...values,
      chapterContent:
        values.chapterContent.slice(0, adjustedStart) +
        issue.suggestion +
        values.chapterContent.slice(adjustedEnd),
    });
    setAppliedSpellcheckFixes((current) => [
      ...current,
      {
        key: issueKey,
        startOffset: issue.startOffset,
        delta: issue.suggestion.length - (issue.endOffset - issue.startOffset),
      },
    ]);
  }

  async function handleLogicCheck() {
    try {
      const accepted = await logicCheckMutation.mutateAsync({
        chapterId,
        content: values.chapterContent,
      });

      setLogicCheckJobId(accepted.jobId);
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
    }
  }

  async function handleCanonCheck() {
    try {
      const accepted = await canonCheckMutation.mutateAsync({
        chapterId,
        content: values.chapterContent,
      });

      setCanonCheckJobId(accepted.jobId);
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.chapterEditor(storyId, chapterId) }));
      }
    }
  }

  async function handlePublish() {
    try {
      await publishChapterMutation.mutateAsync(chapterId);
      setChapterPublishedThisSession(true);

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

  const canonStatusLabel =
    canonCheckJobQuery.data?.status === "processing" || canonCheckJobQuery.data?.status === "queued"
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
    canonCheckMutation.isPending ||
    canonCheckJobQuery.data?.status === "queued" ||
    canonCheckJobQuery.data?.status === "processing";

  return (
    <PlottyShell
      title={chapterQuery.data.title}
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
        aiStatusLabel={aiStatusLabel}
        logicCheckResult={logicCheckJobQuery.data?.result}
        logicStatusLabel={logicStatusLabel}
        canonCheckResult={canonCheckJobQuery.data?.result}
        canonStatusLabel={canonStatusLabel}
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
                <ChapterImageFrame title={chapterQuery.data.title} imageUrl={chapterQuery.data.imageUrl} />
                <GenerateChapterImageButton
                  chapterId={chapterId}
                  chapterTitle={chapterQuery.data.title}
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
        chapterPublished={chapterPublishedThisSession}
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
