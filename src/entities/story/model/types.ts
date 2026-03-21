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
  tags: StoryTag[];
  chaptersCount: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  excerpt?: string;
  status?: StoryStatus;
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
  tags: StoryTag[];
  chapters: ChapterListItem[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  excerpt?: string;
  status?: StoryStatus;
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
  storyExcerpt?: string;
  storyTags?: StoryTag[];
  storyChapters?: ChapterListItem[];
  number?: number;
  wordCount?: number;
  imageUrl?: string;
}

export interface StoriesQuery {
  tags: string[];
  q: string;
  fandom: string;
  rating: string;
  status: string;
  size: string;
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
  excerpt?: string;
  tags?: string[];
}

export interface UpdateStoryPayload {
  title?: string;
  tagIds?: string[];
  description?: string;
  excerpt?: string;
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
