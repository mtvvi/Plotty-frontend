export type StoryStatus = "draft" | "published";
export type AiJobStatus = "queued" | "processing" | "completed" | "failed";
export type AiJobType = "spellcheck" | "image_generation";

export interface StoryTag {
  id: string;
  category?: string;
  slug: string;
  name: string;
}

export interface StoryListItem {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string;
  firstChapterId?: string;
  tags: StoryTag[];
  chaptersCount: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  status?: StoryStatus;
  fandom?: string;
  pairing?: string;
  ratingLabel?: string;
  statusLabel?: string;
  sizeLabel?: string;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  viewerHasLiked?: boolean;
  aiHint?: string;
  summaryLabel?: string;
  readLabel?: string;
  updatedLabel?: string;
}

export interface ChapterListItem {
  id: string;
  title: string;
  updatedAt: string;
  number?: number;
  wordCount?: number;
  hasImage?: boolean;
  imageUrl?: string;
}

export interface StoryDetails {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string;
  tags: StoryTag[];
  chapters: ChapterListItem[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  status?: StoryStatus;
  fandom?: string;
  pairing?: string;
  ratingLabel?: string;
  statusLabel?: string;
  sizeLabel?: string;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  viewerHasLiked?: boolean;
  aiHint?: string;
  summaryLabel?: string;
  readLabel?: string;
  updatedLabel?: string;
}

export interface ChapterDetails {
  id: string;
  storyId: string;
  title: string;
  content: string;
  updatedAt: string;
  storySlug?: string;
  storyTitle?: string;
  storyDescription?: string;
  storyTags?: StoryTag[];
  storyChapters?: ChapterListItem[];
  number?: number;
  wordCount?: number;
  imageUrl?: string;
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
  description?: string;
  tags?: string[];
}

export interface UpdateStoryPayload {
  title?: string;
  tagIds?: string[];
  description?: string;
  tags?: string[];
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
  /** Present when the comment comes from the chapter-scoped API */
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
  /** Present on the wire from the backend; normalized to `viewerHasLiked` in API helpers */
  likedByMe?: boolean;
  commentsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  viewerHasLiked: boolean;
}
