import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import { serializeStoriesQuery } from "../model/story-query";
import type {
  AiJobAccepted,
  AiJobResponse,
  ChapterDetails,
  CreateChapterPayload,
  CreateStoryPayload,
  ImageGenerationPayload,
  ImageGenerationResult,
  SpellcheckPayload,
  SpellcheckResult,
  StoriesQuery,
  StoriesResponse,
  StoryDetails,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "../model/types";

export const storyKeys = {
  all: ["stories"] as const,
  list: (query: StoriesQuery) => ["stories", "list", query] as const,
  details: (slug: string) => ["stories", "details", slug] as const,
  chapter: (chapterId: string) => ["stories", "chapter", chapterId] as const,
  aiJob: (jobId: string) => ["stories", "ai-job", jobId] as const,
};

export function storiesQueryOptions(query: StoriesQuery) {
  const params = serializeStoriesQuery(query);

  return queryOptions({
    queryKey: storyKeys.list(query),
    queryFn: () => fetchJson<StoriesResponse>(`/stories?${params.toString()}`),
  });
}

export function storyDetailsQueryOptions(slug: string) {
  return queryOptions({
    queryKey: storyKeys.details(slug),
    queryFn: () => fetchJson<StoryDetails>(`/stories/${slug}`),
  });
}

export function chapterDetailsQueryOptions(chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapter(chapterId),
    queryFn: () => fetchJson<ChapterDetails>(`/chapters/${chapterId}`),
    enabled: Boolean(chapterId),
  });
}

export function aiJobQueryOptions<TResult>(jobId: string) {
  return queryOptions({
    queryKey: storyKeys.aiJob(jobId),
    queryFn: () => fetchJson<AiJobResponse<TResult>>(`/ai/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });
}

export function createStory(payload: CreateStoryPayload) {
  return fetchJson<StoryDetails>("/stories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStory(storyId: string, payload: UpdateStoryPayload) {
  return fetchJson<StoryDetails>(`/stories/${storyId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteStory(storyId: string) {
  return fetchJson<{ ok: true }>(`/stories/${storyId}`, {
    method: "DELETE",
  });
}

export function createChapter(storyId: string, payload: CreateChapterPayload) {
  return fetchJson<ChapterDetails>(`/stories/${storyId}/chapters`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateChapter(chapterId: string, payload: UpdateChapterPayload) {
  return fetchJson<ChapterDetails>(`/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteChapter(chapterId: string) {
  return fetchJson<{ ok: true }>(`/chapters/${chapterId}`, {
    method: "DELETE",
  });
}

export function startSpellcheck(payload: SpellcheckPayload) {
  return fetchJson<AiJobAccepted>("/ai/spellcheck", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startImageGeneration(payload: ImageGenerationPayload) {
  return fetchJson<AiJobAccepted>("/ai/image-generation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type SpellcheckJobResponse = AiJobResponse<SpellcheckResult>;
export type ImageGenerationJobResponse = AiJobResponse<ImageGenerationResult>;
