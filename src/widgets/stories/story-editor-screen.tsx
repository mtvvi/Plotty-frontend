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
  startSpellcheck,
  storyKeys,
  updateChapter,
} from "@/entities/story/api/stories-api";
import type { SpellcheckResult } from "@/entities/story/model/types";
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
  /** Локально после успешного POST /publish (в API главы пока не приходит status). */
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

  const spellcheckJobQuery = useQuery({
    ...aiJobQueryOptions<SpellcheckResult>(spellcheckJobId),
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

    setSpellcheckJobId(accepted.jobId);
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
        isSaving={updateChapterMutation.isPending}
        isSpellchecking={spellcheckMutation.isPending || spellcheckJobQuery.data?.status === "queued"}
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
      />
    </PlottyShell>
  );
}
