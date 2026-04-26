export type StoryStatus = "draft" | "published";
export type AiJobStatus = "queued" | "processing" | "completed" | "failed";
export type AiJobType = "spellcheck" | "image_generation" | "logic_check";

export interface StoryTag {
  id: string;
  category?: string;
  slug: string;
  name: string;
}

export interface StoryAuthor {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

export interface StoryListItem {
  id: string;
  slug: string;
  title: string;
  tags: StoryTag[];
  chaptersCount: number;
  createdAt: string;
  updatedAt: string;
  status?: StoryStatus;
  fandom?: string;
  ratingLabel?: string;
  statusLabel?: string;
  sizeLabel?: string;
  likesCount?: number;
  viewerHasLiked?: boolean;
  aiHint?: string;
  author?: StoryAuthor | null;
}

export interface ChapterListItem {
  id: string;
  title: string;
  updatedAt: string;
  number?: number;
  status?: StoryStatus;
}

export interface ChapterViewed {
  chapterId: string;
  title: string;
  viewed: boolean;
}

export interface ChaptersViewedResponse {
  items: ChapterViewed[];
}

export interface StoryDetails {
  id: string;
  slug: string;
  title: string;
  tags: StoryTag[];
  chapters: ChapterListItem[];
  createdAt: string;
  updatedAt: string;
  status?: StoryStatus;
  fandom?: string;
  ratingLabel?: string;
  statusLabel?: string;
  sizeLabel?: string;
  likesCount?: number;
  viewerHasLiked?: boolean;
  aiHint?: string;
  author?: StoryAuthor | null;
}

export interface ChapterDetails {
  id: string;
  storyId: string;
  title: string;
  content: string;
  updatedAt: string;
  storySlug?: string;
  storyTitle?: string;
  storyTags?: StoryTag[];
  storyChapters?: ChapterListItem[];
  number?: number;
  wordCount?: number;
  imageUrl?: string;
}

export interface ChapterWikiEntity {
  name?: string;
  state?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ChapterWiki {
  characters?: ChapterWikiEntity[];
  locations?: ChapterWikiEntity[];
  items?: ChapterWikiEntity[];
  [key: string]: unknown;
}

export interface StoriesQuery {
  tags: string[];
  q: string;
  page: number;
  pageSize: number;
}

export interface StoriesResponse {
  items: StoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface CreateStoryPayload {
  title: string;
  tagIds?: string[];
}

export interface UpdateStoryPayload {
  title?: string;
  tagIds?: string[];
}

export interface CreateChapterPayload {
  title: string;
  content: string;
}

export type UpdateChapterPayload = CreateChapterPayload;

export interface SpellcheckIssue {
  fragmentText: string;
  startOffset: number;
  endOffset: number;
  message: string;
  suggestion: string;
}

export interface SpellcheckResult {
  summary: string;
  items: SpellcheckIssue[];
}

export interface LogicCheckResult {
  message: string;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
}

export interface AiJobAccepted {
  jobId: string;
  status: Extract<AiJobStatus, "queued" | "processing">;
}

export interface AiJobResponse<TResult> {
  jobId: string;
  type: AiJobType;
  status: AiJobStatus;
  result?: TResult;
  error?: string;
  errorMessage?: string;
}

export interface SpellcheckPayload {
  chapterId: string;
  content: string;
}

export interface ImageGenerationPayload extends SpellcheckPayload {
  prompt: string;
}

export interface StoryTagsResponse {
  items: StoryTag[];
}

export interface StoryCommentAuthor {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
}

export interface StoryComment {
  id: string;
  storyId: string;
  chapterId?: string;
  author: StoryCommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
  viewerCanDelete?: boolean;
}

export interface StoryCommentsResponse {
  items: StoryComment[];
}

export interface CreateStoryCommentPayload {
  content: string;
}

export interface ToggleLikeResult {
  storyId: string;
  likesCount: number;
  viewerHasLiked: boolean;
}
