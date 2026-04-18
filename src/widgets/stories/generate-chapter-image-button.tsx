"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  aiJobQueryOptions,
  chapterDetailsQueryOptions,
  startImageGeneration,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { ImageGenerationResult } from "@/entities/story/model/types";
import { Button } from "@/shared/ui/button";

export function GenerateChapterImageButton({
  chapterId,
  chapterTitle,
  storySlug,
  storyTitle,
}: {
  chapterId: string;
  chapterTitle: string;
  storySlug: string;
  storyTitle?: string;
}) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState("");

  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });
  const chapterQuery = useQuery({
    ...chapterDetailsQueryOptions(chapterId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const jobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  useEffect(() => {
    if (!jobQuery.data?.result?.images[0]?.imageUrl) {
      return;
    }

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.details(storySlug) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.all }),
    ]);
  }, [chapterId, jobQuery.data?.result?.images, queryClient, storySlug]);

  async function handleGenerate() {
    const chapter = await queryClient.fetchQuery(chapterDetailsQueryOptions(chapterId));
    const accepted = await imageMutation.mutateAsync({
      chapterId,
      content: chapter.content,
      prompt: `Иллюстрация к главе "${chapter.title || chapterTitle}" истории "${storyTitle ?? storySlug}"`,
    });

    setJobId(accepted.jobId);
  }

  const isGenerating =
    imageMutation.isPending || jobQuery.data?.status === "queued" || jobQuery.data?.status === "processing";
  const hasImage = Boolean(chapterQuery.data?.imageUrl || jobQuery.data?.result?.images[0]?.imageUrl);

  return (
    <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? "Генерируем..." : hasImage ? "Обновить иллюстрацию" : "Сгенерировать картинку"}
    </Button>
  );
}
