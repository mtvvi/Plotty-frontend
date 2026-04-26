"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { likeStory, patchStorySummaryCaches, unlikeStory } from "@/entities/story/api/stories-api";

export function useStoryLikeMutation({
  likesCount,
  storyId,
  viewerHasLiked,
}: {
  likesCount?: number;
  storyId: string;
  viewerHasLiked: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ liked }: { liked: boolean }) => (liked ? unlikeStory(storyId) : likeStory(storyId)),
  });

  async function toggleLike() {
    const nextLiked = !viewerHasLiked;
    const previousLikesCount = likesCount ?? 0;

    patchStorySummaryCaches(queryClient, storyId, {
      likesCount: Math.max(previousLikesCount + (nextLiked ? 1 : -1), 0),
      viewerHasLiked: nextLiked,
    });

    try {
      const result = await mutation.mutateAsync({ liked: viewerHasLiked });

      patchStorySummaryCaches(queryClient, storyId, {
        likesCount: result.likesCount,
        viewerHasLiked: result.viewerHasLiked,
      });

      return result;
    } catch (error) {
      patchStorySummaryCaches(queryClient, storyId, {
        likesCount: previousLikesCount,
        viewerHasLiked,
      });

      throw error;
    }
  }

  return {
    isPending: mutation.isPending,
    toggleLike,
  };
}
