export type StoryStatus = "draft" | "published";
export type AiJobStatus = "queued" | "processing" | "completed" | "failed";
export type AiJobType = "spellcheck" | "image_generation";

export interface StoryTag {
  id: string;
  slug: string;
  name: string;
}

export interface StoryListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  status: StoryStatus;
  tags: StoryTag[];
  chaptersCount: number;
  updatedAt: string;
}

export interface ChapterListItem {
  id: string;
  number: number;
  title: string;
  wordCount: number;
  updatedAt: string;
  hasImage: boolean;
  imageUrl?: string;
}

export interface StoryDetails {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  status: StoryStatus;
  tags: StoryTag[];
  chapters: ChapterListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDetails {
  id: string;
  storyId: string;
  storySlug: string;
  storyTitle: string;
  storyDescription: string;
  storyExcerpt: string;
  storyTags: StoryTag[];
  storyChapters: ChapterListItem[];
  number: number;
  title: string;
  content: string;
  wordCount: number;
  updatedAt: string;
  imageUrl?: string;
}

export interface StoriesQuery {
  tags: string[];
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
  description: string;
  excerpt: string;
  tags: string[];
}

export type UpdateStoryPayload = CreateStoryPayload;

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
  errorMessage?: string;
}

export interface SpellcheckPayload {
  chapterId: string;
  content: string;
}

export interface ImageGenerationPayload extends SpellcheckPayload {
  prompt: string;
}
