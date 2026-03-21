"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  aiJobQueryOptions,
  createChapter,
  deleteChapter,
  deleteStory,
  chapterDetailsQueryOptions,
  startImageGeneration,
  startSpellcheck,
  storyKeys,
  updateChapter,
  updateStory,
} from "@/entities/story/api/stories-api";
import type { GeneratedImage, ImageGenerationResult, SpellcheckResult } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";

import { PlottyShell } from "./plotty-shell";
import { StoryEditorForm, type StoryEditorValues } from "./story-editor-form";

const emptyValues: StoryEditorValues = {
  storyTitle: "",
  storyDescription: "",
  storyExcerpt: "",
  selectedTagSlugs: [],
  chapterTitle: "",
  chapterContent: "",
  imagePrompt: "",
};

export function StoryEditorScreen({
  storyId,
  chapterId,
}: {
  storyId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const chapterQuery = useQuery(chapterDetailsQueryOptions(chapterId));
  const [values, setValues] = useState<StoryEditorValues>(emptyValues);
  const [spellcheckJobId, setSpellcheckJobId] = useState("");
  const [imageJobId, setImageJobId] = useState("");

  useEffect(() => {
    if (!chapterQuery.data) {
      return;
    }

    setValues((current) => ({
      storyTitle: chapterQuery.data.storyTitle,
      storyDescription: chapterQuery.data.storyDescription,
      storyExcerpt: chapterQuery.data.storyExcerpt,
      selectedTagSlugs: chapterQuery.data.storyTags.map((tag) => tag.slug),
      chapterTitle: chapterQuery.data.title,
      chapterContent: chapterQuery.data.content,
      imagePrompt: current.imagePrompt,
    }));
  }, [chapterQuery.data]);

  const updateStoryMutation = useMutation({
    mutationFn: ({ targetStoryId, targetPayload }: { targetStoryId: string; targetPayload: StoryEditorValues }) =>
      updateStory(targetStoryId, {
        title: targetPayload.storyTitle,
        description: targetPayload.storyDescription,
        excerpt: targetPayload.storyExcerpt,
        tags: targetPayload.selectedTagSlugs,
      }),
  });
  const updateChapterMutation = useMutation({
    mutationFn: ({ targetChapterId, targetPayload }: { targetChapterId: string; targetPayload: StoryEditorValues }) =>
      updateChapter(targetChapterId, {
        title: targetPayload.chapterTitle,
        content: targetPayload.chapterContent,
      }),
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ nextStoryId, nextTitle }: { nextStoryId: string; nextTitle: string }) =>
      createChapter(nextStoryId, { title: nextTitle, content: "" }),
  });
  const deleteChapterMutation = useMutation({
    mutationFn: deleteChapter,
  });
  const deleteStoryMutation = useMutation({
    mutationFn: deleteStory,
  });
  const spellcheckMutation = useMutation({
    mutationFn: startSpellcheck,
  });
  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });

  const spellcheckJobQuery = useQuery({
    ...aiJobQueryOptions<SpellcheckResult>(spellcheckJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 250;
    },
  });

  const imageJobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(imageJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 250;
    },
  });

  useEffect(() => {
    if (imageJobQuery.data?.status === "completed") {
      void queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
    }
  }, [chapterId, imageJobQuery.data?.status, queryClient]);

  const generatedImage = useMemo<GeneratedImage | undefined>(() => {
    const fromJob = imageJobQuery.data?.result?.images[0];

    if (fromJob) {
      return fromJob;
    }

    if (chapterQuery.data?.imageUrl) {
      return {
        id: "existing-image",
        imageUrl: chapterQuery.data.imageUrl,
        prompt: values.imagePrompt,
      };
    }

    return undefined;
  }, [chapterQuery.data?.imageUrl, imageJobQuery.data?.result, values.imagePrompt]);

  async function handleSave() {
    await updateStoryMutation.mutateAsync({
      targetStoryId: storyId,
      targetPayload: values,
    });
    const chapter = await updateChapterMutation.mutateAsync({
      targetChapterId: chapterId,
      targetPayload: values,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    await queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
    await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapter.storySlug) });
  }

  async function handleCreateNextChapter() {
    if (!chapterQuery.data) {
      return;
    }

    const nextNumber = (chapterQuery.data.storyChapters.at(-1)?.number ?? 0) + 1;
    const chapter = await createChapterMutation.mutateAsync({
      nextStoryId: storyId,
      nextTitle: `Глава ${nextNumber}`,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.details(chapter.storySlug) });
    router.push(routes.chapterEditor(storyId, chapter.id));
  }

  async function handleDeleteChapter() {
    if (!window.confirm("Удалить эту главу?")) {
      return;
    }

    await deleteChapterMutation.mutateAsync(chapterId);
    router.push(routes.story(chapterQuery.data?.storySlug ?? ""));
  }

  async function handleDeleteStory() {
    if (!window.confirm("Удалить историю целиком?")) {
      return;
    }

    await deleteStoryMutation.mutateAsync(storyId);
    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    router.push(routes.home);
  }

  async function handleSpellcheck() {
    const accepted = await spellcheckMutation.mutateAsync({
      chapterId,
      content: values.chapterContent,
    });

    setSpellcheckJobId(accepted.jobId);
  }

  async function handleGenerateImage() {
    const accepted = await imageMutation.mutateAsync({
      chapterId,
      content: values.chapterContent,
      prompt: values.imagePrompt,
    });

    setImageJobId(accepted.jobId);
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
    imageJobQuery.data?.status === "processing" || spellcheckJobQuery.data?.status === "processing"
      ? "AI сейчас обрабатывает запрос."
      : "AI-результаты подтягиваются отдельными job-ами.";

  return (
    <PlottyShell
      title={`Редактор: ${chapterQuery.data.storyTitle}`}
      description={`Глава ${chapterQuery.data.number}. ${chapterQuery.data.title}`}
    >
      <StoryEditorForm
        mode="edit"
        values={values}
        storyId={storyId}
        storySlug={chapterQuery.data.storySlug}
        chapterId={chapterId}
        chapterNumber={chapterQuery.data.number}
        chapters={chapterQuery.data.storyChapters}
        spellcheckResult={spellcheckJobQuery.data?.result}
        generatedImage={generatedImage}
        aiStatusLabel={aiStatusLabel}
        isSaving={updateStoryMutation.isPending || updateChapterMutation.isPending}
        isSpellchecking={spellcheckMutation.isPending || spellcheckJobQuery.data?.status === "queued"}
        isGeneratingImage={imageMutation.isPending || imageJobQuery.data?.status === "queued"}
        onChange={setValues}
        onSave={handleSave}
        onCreateNextChapter={handleCreateNextChapter}
        onDeleteChapter={handleDeleteChapter}
        onDeleteStory={handleDeleteStory}
        onSpellcheck={handleSpellcheck}
        onGenerateImage={handleGenerateImage}
      />
    </PlottyShell>
  );
}
