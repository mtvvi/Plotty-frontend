import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import { getTagName, mapStoryListItem, type BackendStoriesResponse } from "./story-mappers";
import { serializeStoriesQuery } from "../model/story-query";
import type {
  AiJobAccepted,
  AiJobResponse,
  CanonCheckResult,
  ChapterDetails,
  ChaptersViewedResponse,
  ChapterWiki,
  ChapterListItem,
  CreateStoryCommentPayload,
  CreateChapterPayload,
  CreateStoryPayload,
  ImageGenerationPayload,
  ImageGenerationResult,
  LogicCheckResult,
  SpellcheckPayload,
  SpellcheckResult,
  StoryCommentsResponse,
  StoriesQuery,
  StoriesResponse,
  StoryComment,
  StoryDetails,
  StoryListItem,
  StoryTag,
  StoryTagsResponse,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "../model/types";

export type StoriesScope = "public" | "mine";

interface BackendStory {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendStoryDetails extends BackendStory {
  tags?: StoryTag[];
  aiHint?: string;
  status?: StoryDetails["status"];
  likesCount?: number;
  likedByMe?: boolean;
  coverImageUrl?: string | null;
  author?: {
    id: number;
    username: string;
    avatarUrl?: string | null;
  };
  chapters?: Array<{
    id: string;
    title: string;
    updatedAt: string;
    status?: string;
  }>;
}

interface BackendChapterDetails {
  id: string;
  storyId: string;
  title: string;
  content: string;
  updatedAt: string;
  number?: number;
  imageUrl?: string;
  storySlug?: string;
  storyTitle?: string;
}

interface BackendChapterComment {
  id: string;
  chapterId: string;
  userId: number;
  username: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
}

interface BackendStoryMutationResponse {
  id: string;
  slug: string;
  title: string;
  status?: StoryDetails["status"];
  authorId?: number | null;
  aiHint?: string;
  createdAt: string;
  updatedAt: string;
}

const STORY_LOOKUP_PAGE_SIZE = 100;

export const storyKeys = {
  all: ["stories"] as const,
  tags: () => ["stories", "tags"] as const,
  list: (query: StoriesQuery) => ["stories", "list", query] as const,
  details: (slug: string) => ["stories", "details", slug] as const,
  detailsById: (storyId: string) => ["stories", "details-by-id", storyId] as const,
  chapterComments: (chapterId: string) => ["stories", "chapter-comments", chapterId] as const,
  chapter: (chapterId: string) => ["stories", "chapter", chapterId] as const,
  chaptersViewed: (slug: string) => ["stories", "chapters-viewed", slug] as const,
  chapterViewed: (chapterId: string) => ["stories", "chapter-viewed", chapterId] as const,
  chapterWiki: (chapterId: string) => ["stories", "chapter-wiki", chapterId] as const,
  chapterEditor: (storyId: string, chapterId: string) => ["stories", "chapter-editor", storyId, chapterId] as const,
  aiJob: (jobId: string) => ["stories", "ai-job", jobId] as const,
};

function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function mapStoryDetails(item: BackendStoryDetails): StoryDetails {
  const chapterRows = item.chapters ?? [];
  const tags = item.tags ?? [];
  const chapters: ChapterListItem[] = chapterRows.map((chapter, index) => ({
    id: chapter.id,
    number: index + 1,
    title: chapter.title,
    updatedAt: chapter.updatedAt,
    status: chapter.status === "draft" || chapter.status === "published" ? chapter.status : undefined,
  }));

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    tags,
    chapters,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    status: item.status,
    fandom: getTagName(tags, "directionality"),
    ratingLabel: getTagName(tags, "rating"),
    statusLabel: getTagName(tags, "completion"),
    sizeLabel: getTagName(tags, "size"),
    likesCount: item.likesCount,
    aiHint: item.aiHint,
    viewerHasLiked: item.likedByMe,
    author: item.author,
    coverImageUrl: item.coverImageUrl ?? null,
  };
}

function mapChapterDetails(item: BackendChapterDetails): ChapterDetails {
  return {
    id: item.id,
    storyId: item.storyId,
    title: item.title,
    content: item.content,
    updatedAt: item.updatedAt,
    number: item.number,
    imageUrl: item.imageUrl,
    storySlug: item.storySlug,
    storyTitle: item.storyTitle,
    wordCount: countWords(item.content),
  };
}

function mapChapterComment(comment: BackendChapterComment, storyId: string): StoryComment {
  return {
    id: comment.id,
    storyId,
    chapterId: comment.chapterId,
    author: {
      id: comment.userId,
      username: comment.username,
      email: "",
      avatarUrl: comment.avatarUrl,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.createdAt,
  };
}

function enrichChapterDetails(chapter: BackendChapterDetails, story: StoryDetails): ChapterDetails {
  const mappedChapter = mapChapterDetails(chapter);
  const storyChapter = story.chapters.find((item) => item.id === chapter.id);

  return {
    ...mappedChapter,
    storySlug: story.slug,
    storyTitle: story.title,
    storyTags: story.tags,
    storyChapters: story.chapters,
    number: storyChapter?.number,
  };
}

async function fetchStoriesPage(query: StoriesQuery, signal?: AbortSignal) {
  const params = serializeStoriesQuery(query);

  return fetchJson<BackendStoriesResponse>(`/stories?${params.toString()}`, { signal });
}

async function fetchMyStoriesPage(query: StoriesQuery, signal?: AbortSignal) {
  const params = serializeStoriesQuery(query);

  return fetchJson<BackendStoriesResponse>(`/stories/mine?${params.toString()}`, { signal });
}

async function fetchStoryDetails(slug: string) {
  const story = await fetchJson<BackendStoryDetails>(`/stories/${slug}`);

  return mapStoryDetails(story);
}

async function fetchStoryDetailsById(storyId: string, scope: StoriesScope) {
  let page = 1;
  let total = 0;

  do {
    const response = await (scope === "mine" ? fetchMyStoriesPage : fetchStoriesPage)({
      tags: [],
      q: "",
      page,
      pageSize: STORY_LOOKUP_PAGE_SIZE,
    });

    const match = response.items.find((item) => item.id === storyId);

    if (match) {
      return fetchStoryDetails(match.slug);
    }

    total = response.pagination.total;
    page += 1;
  } while ((page - 1) * STORY_LOOKUP_PAGE_SIZE < total);

  throw new Error(`Story not found: ${storyId}`);
}

export function storyTagsQueryOptions() {
  return queryOptions({
    queryKey: storyKeys.tags(),
    queryFn: () => fetchJson<StoryTagsResponse>("/tags"),
  });
}

export function storiesQueryOptions(query: StoriesQuery) {
  return queryOptions({
    queryKey: storyKeys.list(query),
    queryFn: async ({ signal }): Promise<StoriesResponse> => {
      const response = await fetchStoriesPage(query, signal);

      return {
        items: response.items.map(mapStoryListItem),
        pagination: response.pagination,
      };
    },
  });
}

export function myStoriesQueryOptions(query: StoriesQuery, options?: { userId?: number | null }) {
  const userKey = options?.userId ? String(options.userId) : "anonymous";

  return queryOptions({
    queryKey: [...storyKeys.list(query), "mine", userKey] as const,
    queryFn: async ({ signal }): Promise<StoriesResponse> => {
      const response = await fetchMyStoriesPage(query, signal);

      return {
        items: response.items.map(mapStoryListItem),
        pagination: response.pagination,
      };
    },
    enabled: Boolean(options?.userId),
  });
}

export function storyDetailsQueryOptions(slug: string) {
  return queryOptions({
    queryKey: storyKeys.details(slug),
    queryFn: () => fetchStoryDetails(slug),
  });
}

export function storyDetailsByIdQueryOptions(storyId: string, options?: { scope?: StoriesScope }) {
  const scope = options?.scope ?? "public";

  return queryOptions({
    queryKey: [...storyKeys.detailsById(storyId), scope] as const,
    queryFn: () => fetchStoryDetailsById(storyId, scope),
    enabled: Boolean(storyId),
  });
}

async function fetchChapterCommentsPage(chapterId: string) {
  const params = new URLSearchParams({ page: "1", pageSize: "100" });

  return fetchJson<{ items: BackendChapterComment[] }>(`/chapters/${chapterId}/comments?${params.toString()}`);
}

export function chapterCommentsQueryOptions(storyId: string, chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterComments(chapterId),
    queryFn: async (): Promise<StoryCommentsResponse> => {
      const response = await fetchChapterCommentsPage(chapterId);

      return {
        items: response.items.map((comment) => mapChapterComment(comment, storyId)),
      };
    },
    enabled: Boolean(storyId && chapterId),
  });
}

export function chapterDetailsQueryOptions(chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapter(chapterId),
    queryFn: async () => mapChapterDetails(await fetchJson<BackendChapterDetails>(`/chapters/${chapterId}`)),
    enabled: Boolean(chapterId),
  });
}

export function chaptersViewedQueryOptions(slug: string) {
  return queryOptions({
    queryKey: storyKeys.chaptersViewed(slug),
    queryFn: () => fetchJson<ChaptersViewedResponse>(`/stories/${slug}/chapters/viewed`),
    enabled: Boolean(slug),
  });
}

export function chapterViewedQueryOptions(chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterViewed(chapterId),
    queryFn: () => fetchJson<{ viewed: boolean }>(`/chapters/${chapterId}/viewed`),
    enabled: Boolean(chapterId),
  });
}

export function markChapterViewed(chapterId: string) {
  return fetchJson<null>(`/chapters/${chapterId}/view`, {
    method: "POST",
  });
}

export function chapterWikiQueryOptions(chapterId: string, options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: storyKeys.chapterWiki(chapterId),
    queryFn: () => fetchJson<ChapterWiki>(`/chapters/${chapterId}/wiki`),
    enabled: Boolean(chapterId) && (options?.enabled ?? true),
  });
}

export function chapterEditorDetailsQueryOptions(storyId: string, chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterEditor(storyId, chapterId),
    queryFn: async () => {
      const [chapter, story] = await Promise.all([
        fetchJson<BackendChapterDetails>(`/chapters/${chapterId}`),
        fetchStoryDetailsById(storyId, "mine"),
      ]);

      return enrichChapterDetails(chapter, story);
    },
    enabled: Boolean(storyId && chapterId),
  });
}

export function aiJobQueryOptions<TResult>(jobId: string) {
  return queryOptions({
    queryKey: storyKeys.aiJob(jobId),
    queryFn: async () => {
      const response = await fetchJson<AiJobResponse<TResult>>(`/ai/jobs/${jobId}`);

      return {
        ...response,
        errorMessage: response.errorMessage ?? response.error,
      };
    },
    enabled: Boolean(jobId),
  });
}

export function createStory(payload: CreateStoryPayload) {
  return fetchJson<BackendStoryMutationResponse>("/stories", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      tagIds: payload.tagIds ?? [],
    }),
  }).then((story) => fetchStoryDetails(story.slug));
}

export function updateStory(storyId: string, payload: UpdateStoryPayload) {
  const body: { title?: string; tagIds?: string[] } = {};

  if (payload.title !== undefined) {
    body.title = payload.title;
  }

  if (payload.tagIds !== undefined) {
    body.tagIds = payload.tagIds;
  }

  return fetchJson<BackendStoryMutationResponse>(`/stories/${storyId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((story) => fetchStoryDetails(story.slug));
}

export function deleteStory(storyId: string) {
  return fetchJson<null>(`/stories/${storyId}`, {
    method: "DELETE",
  });
}

export function createChapter(storyId: string, payload: CreateChapterPayload) {
  return fetchJson<BackendChapterDetails>(`/stories/${storyId}/chapters`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapChapterDetails);
}

export function updateChapter(chapterId: string, payload: UpdateChapterPayload) {
  return fetchJson<BackendChapterDetails>(`/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then(mapChapterDetails);
}

export function deleteChapter(chapterId: string) {
  return fetchJson<null>(`/chapters/${chapterId}`, {
    method: "DELETE",
  });
}

export function publishChapter(chapterId: string) {
  return fetchJson<{ status: string }>(`/chapters/${chapterId}/publish`, {
    method: "POST",
  });
}

export function likeStory(storyId: string) {
  return fetchJson<{ likesCount: number; likedByMe: boolean }>(`/stories/${storyId}/like`, {
    method: "POST",
  }).then((response) => ({
    likesCount: response.likesCount,
    storyId,
    viewerHasLiked: response.likedByMe,
  }));
}

export function unlikeStory(storyId: string) {
  return fetchJson<{ likesCount: number; likedByMe: boolean }>(`/stories/${storyId}/like`, {
    method: "DELETE",
  }).then((response) => ({
    likesCount: response.likesCount,
    storyId,
    viewerHasLiked: response.likedByMe,
  }));
}

export function addChapterComment(storyId: string, chapterId: string, payload: CreateStoryCommentPayload) {
  return fetchJson<BackendChapterComment>(`/chapters/${chapterId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((comment) => mapChapterComment(comment, storyId));
}

export function deleteStoryComment(commentId: string) {
  return fetchJson<null>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function startSpellcheck(payload: SpellcheckPayload) {
  return fetchJson<AiJobAccepted>("/ai/spellcheck", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startLogicCheck(payload: SpellcheckPayload) {
  return fetchJson<AiJobAccepted>("/ai/logic-check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startCanonCheck(payload: SpellcheckPayload) {
  return fetchJson<AiJobAccepted>("/ai/canon-check", {
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

type StorySummaryFields = Pick<
  StoryListItem,
  "likesCount" | "viewerHasLiked"
>;

export function patchStorySummaryCaches(
  queryClient: QueryClient,
  storyId: string,
  patch: Partial<StorySummaryFields>,
) {
  queryClient.setQueriesData<StoriesResponse>({ queryKey: ["stories", "list"] }, (current) =>
    current
      ? {
          ...current,
          items: current.items.map((item) => (item.id === storyId ? { ...item, ...patch } : item)),
        }
      : current,
  );

  queryClient.setQueriesData<StoryDetails>({ queryKey: ["stories", "details"] }, (current) =>
    current && current.id === storyId ? { ...current, ...patch } : current,
  );

  queryClient.setQueriesData<StoryDetails>({ queryKey: ["stories", "details-by-id"] }, (current) =>
    current && current.id === storyId ? { ...current, ...patch } : current,
  );
}

export type SpellcheckJobResponse = AiJobResponse<SpellcheckResult>;
export type LogicCheckJobResponse = AiJobResponse<LogicCheckResult>;
export type CanonCheckJobResponse = AiJobResponse<CanonCheckResult>;
export type ImageGenerationJobResponse = AiJobResponse<ImageGenerationResult>;
