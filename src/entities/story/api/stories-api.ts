import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";
import { encodePathSegment, sanitizePersistedImageUrl } from "@/shared/lib/safe-url";

import { normalizeCanonCheckResult } from "./canon-check-result";
import { getTagName, mapStoryListItem, type BackendStoriesResponse } from "./story-mappers";
import { serializeStoriesQuery } from "../model/story-query";
import type {
  AiJobAccepted,
  AiJobResponse,
  CanonCheckPayload,
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
  UpdateStoryCommentPayload,
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
  description?: string;
  status?: StoryDetails["status"];
  likesCount?: number;
  likedByMe?: boolean;
  coverUrl?: string | null;
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
  status?: string;
  draftTitle?: string | null;
  draftContent?: string | null;
  hasUnpublishedChanges?: boolean;
  publishedTitle?: string | null;
  publishedContent?: string | null;
  publishedUpdatedAt?: string | null;
  number?: number;
  imageUrl?: string;
  storySlug?: string;
  storyTitle?: string;
  storyTags?: StoryTag[];
}

interface BackendChapterComment {
  id: string;
  chapterId: string;
  userId?: number;
  username?: string;
  author?: {
    id?: number;
    username?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  viewerCanDelete?: boolean;
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
};

export const aiKeys = {
  all: ["ai"] as const,
  job: (jobId: string) => ["ai", "job", jobId] as const,
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
    description: item.description,
    viewerHasLiked: item.likedByMe,
    author: item.author
      ? {
          ...item.author,
          avatarUrl: sanitizePersistedImageUrl(item.author.avatarUrl) ?? null,
        }
      : item.author,
    coverImageUrl: sanitizePersistedImageUrl(item.coverImageUrl ?? item.coverUrl) ?? null,
  };
}

function mapChapterDetails(item: BackendChapterDetails): ChapterDetails {
  const status = item.status === "draft" || item.status === "published" ? item.status : undefined;
  const draftTitle = item.draftTitle ?? item.title;
  const draftContent = item.draftContent ?? item.content;
  const publishedTitle = item.publishedTitle ?? (status === "published" ? item.title : null);
  const publishedContent = item.publishedContent ?? (status === "published" ? item.content : null);

  return {
    id: item.id,
    storyId: item.storyId,
    title: item.title,
    content: item.content,
    updatedAt: item.updatedAt,
    status,
    draftTitle,
    draftContent,
    hasUnpublishedChanges:
      item.hasUnpublishedChanges ??
      (typeof publishedContent === "string" &&
        (draftTitle !== publishedTitle || draftContent !== publishedContent)),
    publishedTitle,
    publishedContent,
    publishedUpdatedAt: item.publishedUpdatedAt ?? (status === "published" ? item.updatedAt : null),
    number: item.number,
    imageUrl: sanitizePersistedImageUrl(item.imageUrl),
    storySlug: item.storySlug,
    storyTitle: item.storyTitle,
    storyTags: item.storyTags ?? [],
    wordCount: countWords(item.content),
  };
}

function mapChapterComment(comment: BackendChapterComment, storyId: string): StoryComment {
  const author = comment.author;
  const username = author?.username ?? comment.username ?? "Читатель";

  return {
    id: comment.id,
    storyId,
    chapterId: comment.chapterId,
    author: {
      id: author?.id ?? comment.userId ?? 0,
      username,
      email: author?.email ?? "",
      avatarUrl: sanitizePersistedImageUrl(author?.avatarUrl ?? comment.avatarUrl) ?? null,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt ?? comment.createdAt,
    viewerCanDelete: comment.viewerCanDelete,
  };
}

function enrichChapterDetails(chapter: BackendChapterDetails, story: StoryDetails): ChapterDetails {
  const mappedChapter = mapChapterDetails(chapter);
  const storyChapter = story.chapters.find((item) => item.id === chapter.id);
  const chapterTitle = mappedChapter.draftTitle ?? mappedChapter.title;
  const storyTags = story.tags.length ? story.tags : mappedChapter.storyTags;

  return {
    ...mappedChapter,
    storySlug: story.slug,
    storyTitle: story.title,
    storyTags,
    storyChapters: story.chapters.map((item) =>
      item.id === chapter.id ? { ...item, title: chapterTitle, status: mappedChapter.status ?? item.status } : item,
    ),
    number: storyChapter?.number,
  };
}

function appendQueryString(path: string, params: URLSearchParams) {
  const queryString = params.toString();

  return queryString ? `${path}?${queryString}` : path;
}

async function fetchStoriesPage(query: StoriesQuery, signal?: AbortSignal) {
  const params = serializeStoriesQuery(query);

  return fetchJson<BackendStoriesResponse>(appendQueryString("/stories", params), { signal });
}

async function fetchMyStoriesPage(query: StoriesQuery, signal?: AbortSignal) {
  const params = serializeStoriesQuery(query);

  return fetchJson<BackendStoriesResponse>(appendQueryString("/stories/mine", params), { signal });
}

export async function fetchMyStories(query: StoriesQuery, signal?: AbortSignal): Promise<StoriesResponse> {
  const response = await fetchMyStoriesPage(query, signal);

  return {
    items: response.items.map(mapStoryListItem),
    pagination: response.pagination,
  };
}

async function fetchStoryDetails(slug: string) {
  const story = await fetchJson<BackendStoryDetails>(`/stories/${encodePathSegment(slug)}`);

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
    queryFn: ({ signal }): Promise<StoriesResponse> => fetchMyStories(query, signal),
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

  return fetchJson<{ items: BackendChapterComment[] }>(
    `/chapters/${encodePathSegment(chapterId)}/comments?${params.toString()}`,
  );
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
    queryFn: async () => mapChapterDetails(await fetchJson<BackendChapterDetails>(`/chapters/${encodePathSegment(chapterId)}`)),
    enabled: Boolean(chapterId),
  });
}

export function chaptersViewedQueryOptions(slug: string) {
  return queryOptions({
    queryKey: storyKeys.chaptersViewed(slug),
    queryFn: () => fetchJson<ChaptersViewedResponse>(`/stories/${encodePathSegment(slug)}/chapters/viewed`),
    enabled: Boolean(slug),
  });
}

export function chapterViewedQueryOptions(chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterViewed(chapterId),
    queryFn: () => fetchJson<{ viewed: boolean }>(`/chapters/${encodePathSegment(chapterId)}/viewed`),
    enabled: Boolean(chapterId),
  });
}

export function markChapterViewed(chapterId: string) {
  return fetchJson<null>(`/chapters/${encodePathSegment(chapterId)}/view`, {
    method: "POST",
  });
}

export function chapterWikiQueryOptions(chapterId: string, options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: storyKeys.chapterWiki(chapterId),
    queryFn: () => fetchJson<ChapterWiki>(`/chapters/${encodePathSegment(chapterId)}/wiki`),
    enabled: Boolean(chapterId) && (options?.enabled ?? true),
  });
}

export function chapterEditorDetailsQueryOptions(storyId: string, chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterEditor(storyId, chapterId),
    queryFn: async () => {
      const [chapter, story] = await Promise.all([
        fetchJson<BackendChapterDetails>(`/chapters/${encodePathSegment(chapterId)}`),
        fetchStoryDetailsById(storyId, "mine"),
      ]);

      return enrichChapterDetails(chapter, story);
    },
    enabled: Boolean(storyId && chapterId),
  });
}

export function aiJobQueryOptions<TResult>(jobId: string, options?: { mapResult?: (result: unknown) => TResult }) {
  return queryOptions({
    queryKey: aiKeys.job(jobId),
    queryFn: async () => {
      const response = await fetchJson<AiJobResponse<unknown>>(`/ai/jobs/${encodePathSegment(jobId)}`);

      return {
        ...response,
        result:
          response.result === undefined
            ? undefined
            : options?.mapResult
              ? options.mapResult(response.result)
              : (response.result as TResult),
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

  return fetchJson<BackendStoryMutationResponse>(`/stories/${encodePathSegment(storyId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((story) => fetchStoryDetails(story.slug));
}

export function deleteStory(storyId: string) {
  return fetchJson<null>(`/stories/${encodePathSegment(storyId)}`, {
    method: "DELETE",
  });
}

export function createChapter(storyId: string, payload: CreateChapterPayload) {
  return fetchJson<BackendChapterDetails>(`/stories/${encodePathSegment(storyId)}/chapters`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapChapterDetails);
}

export function updateChapter(chapterId: string, payload: UpdateChapterPayload) {
  const title = payload.title.trim();
  const content = payload.content.trim();

  return fetchJson<BackendChapterDetails>(`/chapters/${encodePathSegment(chapterId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      title,
      content,
    }),
  }).then(mapChapterDetails);
}

export function deleteChapter(chapterId: string) {
  return fetchJson<null>(`/chapters/${encodePathSegment(chapterId)}`, {
    method: "DELETE",
  });
}

export function publishChapter(chapterId: string) {
  return fetchJson<{ status: string }>(`/chapters/${encodePathSegment(chapterId)}/publish`, {
    method: "POST",
  });
}

export function likeStory(storyId: string) {
  return fetchJson<{ likesCount: number; likedByMe: boolean }>(`/stories/${encodePathSegment(storyId)}/like`, {
    method: "POST",
  }).then((response) => ({
    likesCount: response.likesCount,
    storyId,
    viewerHasLiked: response.likedByMe,
  }));
}

export function unlikeStory(storyId: string) {
  return fetchJson<{ likesCount: number; likedByMe: boolean }>(`/stories/${encodePathSegment(storyId)}/like`, {
    method: "DELETE",
  }).then((response) => ({
    likesCount: response.likesCount,
    storyId,
    viewerHasLiked: response.likedByMe,
  }));
}

export function addChapterComment(storyId: string, chapterId: string, payload: CreateStoryCommentPayload) {
  return fetchJson<BackendChapterComment>(`/chapters/${encodePathSegment(chapterId)}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((comment) => mapChapterComment(comment, storyId));
}

export function updateStoryComment(storyId: string, commentId: string, payload: UpdateStoryCommentPayload) {
  return fetchJson<BackendChapterComment>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then((comment) => mapChapterComment(comment, storyId));
}

export function deleteStoryComment(commentId: string) {
  return fetchJson<null>(`/comments/${encodePathSegment(commentId)}`, {
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

export function startCanonCheck(chapterId: string, payload?: Omit<CanonCheckPayload, "chapterId">) {
  const body = payload
    ? JSON.stringify({
        chapterId,
        title: payload.title?.trim(),
        content: payload.content.trim(),
      })
    : undefined;

  return fetchJson<AiJobAccepted>(`/chapters/${encodePathSegment(chapterId)}/canon-check`, {
    method: "POST",
    ...(body ? { body } : {}),
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
export { normalizeCanonCheckResult };
