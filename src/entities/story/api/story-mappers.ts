import type { StoryDetails, StoryListItem, StoryTag } from "@/entities/story/model/types";
import { sanitizeImageUrl } from "@/shared/lib/safe-url";

export interface BackendStoryListItem {
  id: string;
  slug: string;
  title: string;
  tags?: StoryTag[];
  chaptersCount: number;
  status?: StoryDetails["status"];
  likesCount?: number;
  likedByMe?: boolean;
  aiHint?: string;
  coverUrl?: string | null;
  coverImageUrl?: string | null;
  readChapterNumber?: number | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface BackendStoriesResponse {
  items: BackendStoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function getTagName(tags: StoryTag[], category: string) {
  return tags.find((tag) => tag.category === category)?.name;
}

export function mapStoryListItem(item: BackendStoryListItem): StoryListItem {
  const tags = item.tags ?? [];

  const story: StoryListItem = {
    id: item.id,
    slug: item.slug,
    title: item.title,
    tags,
    chaptersCount: item.chaptersCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    status: item.status,
    fandom: getTagName(tags, "directionality"),
    ratingLabel: getTagName(tags, "rating"),
    statusLabel: getTagName(tags, "completion"),
    sizeLabel: getTagName(tags, "size"),
    likesCount: item.likesCount,
    viewerHasLiked: item.likedByMe,
    aiHint: item.aiHint,
    author: item.author
      ? {
          ...item.author,
          avatarUrl: sanitizeImageUrl(item.author.avatarUrl) ?? null,
        }
      : item.author,
    coverImageUrl: sanitizeImageUrl(item.coverImageUrl ?? item.coverUrl) ?? null,
  };

  if (Object.prototype.hasOwnProperty.call(item, "readChapterNumber")) {
    story.readChapterNumber = item.readChapterNumber;
  }

  return story;
}
