"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  aiJobQueryOptions,
  chapterDetailsQueryOptions,
  startImageGeneration,
  storyKeys,
} from "@/entities/story/api/stories-api";
import * as generatedImageCache from "@/entities/story/model/generated-image-cache";
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
  const shouldPromoteAsStoryCoverRef = useRef(false);

  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });

  const jobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  useEffect(() => {
    const imageUrl = jobQuery.data?.result?.images[0]?.imageUrl;

    if (!imageUrl) {
      return;
    }

    generatedImageCache.setGeneratedImageUrl(chapterId, imageUrl);
    if (shouldPromoteAsStoryCoverRef.current) {
      setStoryCoverInCache(storySlug, imageUrl);
    }
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.details(storySlug) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.all }),
    ]);
  }, [chapterId, jobQuery.data?.result?.images, queryClient, storySlug]);

  async function handleGenerate() {
    const chapter = await queryClient.fetchQuery(chapterDetailsQueryOptions(chapterId));
    shouldPromoteAsStoryCoverRef.current = chapter.number === 1;
    const accepted = await imageMutation.mutateAsync({
      chapterId,
      content: chapter.content,
      prompt: `Иллюстрация к главе "${chapter.title || chapterTitle}" истории "${storyTitle ?? storySlug}"`,
    });

    setJobId(accepted.jobId);
  }

  const isGenerating =
    imageMutation.isPending || jobQuery.data?.status === "queued" || jobQuery.data?.status === "processing";
  const hasImage = Boolean(generatedImageCache.getGeneratedImageUrl(chapterId));

  return (
    <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? "Генерируем..." : hasImage ? "Обновить иллюстрацию" : "Сгенерировать картинку"}
    </Button>
  );
}

function setStoryCoverInCache(storySlug: string, imageUrl: string) {
  if (typeof generatedImageCache.setGeneratedStoryCoverUrl === "function") {
    generatedImageCache.setGeneratedStoryCoverUrl(storySlug, imageUrl);
  }
}
