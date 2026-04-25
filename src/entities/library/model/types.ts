import type { StoryListItem } from "@/entities/story/model/types";

export type ReaderShelf = "reading" | "planned" | "read" | "dropped" | "favorite";

export interface ReaderShelfEntry {
  storyId: string;
  shelf: ReaderShelf;
  updatedAt: string;
  story: StoryListItem;
}

export interface ReaderShelfResponse {
  items: ReaderShelfEntry[];
}
