import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import { serializeStoriesQuery } from "../model/story-query";
import type {
  AiJobAccepted,
  AiJobResponse,
  ChapterDetails,
  ChapterListItem,
  CreateStoryCommentPayload,
  CreateChapterPayload,
  CreateStoryPayload,
  ImageGenerationPayload,
  ImageGenerationResult,
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
  ToggleLikeResult,
  UpdateChapterPayload,
  UpdateStoryPayload,
} from "../model/types";

interface BackendStory {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendStoryListItem extends BackendStory {
  tags: StoryTag[];
  chaptersCount: number;
  coverImageUrl?: string;
  firstChapterId?: string;
  description?: string;
  excerpt?: string;
  status?: StoryDetails["status"];
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  viewerHasLiked?: boolean;
  updatedLabel?: string;
}

interface BackendStoryDetails extends BackendStory {
  tags: StoryTag[];
  coverImageUrl?: string;
  description?: string;
  excerpt?: string;
  status?: StoryDetails["status"];
  fandom?: string;
  pairing?: string;
  ratingLabel?: string;
  statusLabel?: string;
  sizeLabel?: string;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  aiHint?: string;
  summaryLabel?: string;
  readLabel?: string;
  updatedLabel?: string;
  chapters: Array<{
    id: string;
    title: string;
    updatedAt: string;
    imageUrl?: string;
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

interface BackendStoriesResponse {
  items: BackendStoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface BackendStoryComment {
  id: string;
  storyId: string;
  author: {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  viewerCanDelete?: boolean;
}

const STORY_LOOKUP_PAGE_SIZE = 100;

export const storyKeys = {
  all: ["stories"] as const,
  tags: () => ["stories", "tags"] as const,
  list: (query: StoriesQuery) => ["stories", "list", query] as const,
  details: (slug: string) => ["stories", "details", slug] as const,
  detailsById: (storyId: string) => ["stories", "details-by-id", storyId] as const,
  comments: (storyId: string) => ["stories", "comments", storyId] as const,
  chapter: (chapterId: string) => ["stories", "chapter", chapterId] as const,
  chapterEditor: (storyId: string, chapterId: string) => ["stories", "chapter-editor", storyId, chapterId] as const,
  aiJob: (jobId: string) => ["stories", "ai-job", jobId] as const,
};

function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function getTagName(tags: StoryTag[], category: string) {
  return tags.find((tag) => tag.category === category)?.name;
}

function mapStoryListItem(item: BackendStoryListItem): StoryListItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    coverImageUrl: item.coverImageUrl,
    firstChapterId: item.firstChapterId,
    tags: item.tags,
    chaptersCount: item.chaptersCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    description: item.description,
    excerpt: item.excerpt,
    status: item.status,
    fandom: getTagName(item.tags, "directionality"),
    ratingLabel: getTagName(item.tags, "rating"),
    statusLabel: getTagName(item.tags, "completion"),
    sizeLabel: getTagName(item.tags, "size"),
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
    bookmarksCount: item.bookmarksCount,
    viewsCount: item.viewsCount,
    viewerHasLiked: item.viewerHasLiked,
    updatedLabel: item.updatedLabel,
  };
}

function mapStoryDetails(item: BackendStoryDetails): StoryDetails {
  const chapters: ChapterListItem[] = item.chapters.map((chapter, index) => ({
    id: chapter.id,
    number: index + 1,
    title: chapter.title,
    updatedAt: chapter.updatedAt,
    imageUrl: chapter.imageUrl,
    hasImage: Boolean(chapter.imageUrl),
  }));

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    coverImageUrl: item.coverImageUrl ?? item.chapters.find((chapter) => chapter.imageUrl)?.imageUrl,
    tags: item.tags,
    chapters,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    description: item.description,
    excerpt: item.excerpt,
    status: item.status,
    fandom: item.fandom ?? getTagName(item.tags, "directionality"),
    pairing: item.pairing,
    ratingLabel: item.ratingLabel ?? getTagName(item.tags, "rating"),
    statusLabel: item.statusLabel ?? getTagName(item.tags, "completion"),
    sizeLabel: item.sizeLabel ?? getTagName(item.tags, "size"),
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
    bookmarksCount: item.bookmarksCount,
    aiHint: item.aiHint,
    summaryLabel: item.summaryLabel,
    readLabel: item.readLabel,
    updatedLabel: item.updatedLabel,
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

function mapStoryComment(comment: BackendStoryComment): StoryComment {
  return {
    id: comment.id,
    storyId: comment.storyId,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      email: comment.author.email,
      avatarUrl: comment.author.avatarUrl,
    },
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    viewerCanDelete: comment.viewerCanDelete,
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

async function fetchStoryDetails(slug: string) {
  const story = await fetchJson<BackendStoryDetails>(`/stories/${slug}`);

  return mapStoryDetails(story);
}

async function fetchStoryDetailsById(storyId: string) {
  let page = 1;
  let total = 0;

  do {
    const response = await fetchStoriesPage({
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

export function storyDetailsQueryOptions(slug: string) {
  return queryOptions({
    queryKey: storyKeys.details(slug),
    queryFn: () => fetchStoryDetails(slug),
  });
}

export function storyDetailsByIdQueryOptions(storyId: string) {
  return queryOptions({
    queryKey: storyKeys.detailsById(storyId),
    queryFn: () => fetchStoryDetailsById(storyId),
    enabled: Boolean(storyId),
  });
}

export function storyCommentsQueryOptions(storyId: string) {
  return queryOptions({
    queryKey: storyKeys.comments(storyId),
    queryFn: async (): Promise<StoryCommentsResponse> => {
      const response = await fetchJson<{ items: BackendStoryComment[] }>(`/stories/${storyId}/comments`);

      return {
        items: response.items.map(mapStoryComment),
      };
    },
    enabled: Boolean(storyId),
  });
}

export function chapterDetailsQueryOptions(chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapter(chapterId),
    queryFn: async () => mapChapterDetails(await fetchJson<BackendChapterDetails>(`/chapters/${chapterId}`)),
    enabled: Boolean(chapterId),
  });
}

export function chapterEditorDetailsQueryOptions(storyId: string, chapterId: string) {
  return queryOptions({
    queryKey: storyKeys.chapterEditor(storyId, chapterId),
    queryFn: async () => {
      const [chapter, story] = await Promise.all([
        fetchJson<BackendChapterDetails>(`/chapters/${chapterId}`),
        fetchStoryDetailsById(storyId),
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
  return fetchJson<BackendStoryDetails>("/stories", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      tagIds: payload.tagIds ?? [],
      description: payload.description,
      excerpt: payload.excerpt,
    }),
  }).then(mapStoryDetails);
}

export function updateStory(storyId: string, payload: UpdateStoryPayload) {
  return fetchJson<BackendStoryDetails>(`/stories/${storyId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      excerpt: payload.excerpt,
      tagIds: payload.tagIds,
    }),
  }).then(mapStoryDetails);
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

export function likeStory(storyId: string) {
  return fetchJson<ToggleLikeResult>(`/stories/${storyId}/like`, {
    method: "POST",
  });
}

export function unlikeStory(storyId: string) {
  return fetchJson<ToggleLikeResult>(`/stories/${storyId}/like`, {
    method: "DELETE",
  });
}

export function addStoryComment(storyId: string, payload: CreateStoryCommentPayload) {
  return fetchJson<BackendStoryComment>(`/stories/${storyId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapStoryComment);
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

export function startImageGeneration(payload: ImageGenerationPayload) {
  return fetchJson<AiJobAccepted>("/ai/image-generation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

type StorySummaryFields = Pick<
  StoryListItem,
  "likesCount" | "commentsCount" | "bookmarksCount" | "viewsCount" | "viewerHasLiked"
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
export type ImageGenerationJobResponse = AiJobResponse<ImageGenerationResult>;
