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
  hasImage = false,
}: {
  chapterId: string;
  chapterTitle: string;
  storySlug: string;
  hasImage?: boolean;
}) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState("");

  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });

  const jobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 250;
    },
  });

  useEffect(() => {
    if (jobQuery.data?.status !== "completed") {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) });
    void queryClient.invalidateQueries({ queryKey: storyKeys.details(storySlug) });
  }, [chapterId, jobQuery.data?.status, queryClient, storySlug]);

  async function handleGenerate() {
    const chapter = await queryClient.fetchQuery(chapterDetailsQueryOptions(chapterId));
    const accepted = await imageMutation.mutateAsync({
      chapterId,
      content: chapter.content,
      prompt: `Иллюстрация к главе "${chapter.title || chapterTitle}" истории "${chapter.storyTitle}"`,
    });

    setJobId(accepted.jobId);
  }

  const isGenerating =
    imageMutation.isPending || jobQuery.data?.status === "queued" || jobQuery.data?.status === "processing";

  return (
    <Button variant={hasImage ? "soft" : "secondary"} onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? "Генерируем..." : hasImage ? "Обновить картинку" : "Сгенерировать картинку"}
    </Button>
  );
}
