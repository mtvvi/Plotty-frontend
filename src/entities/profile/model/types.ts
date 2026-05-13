import type { StoryListItem } from "@/entities/story/model/types";

export interface PublicUserProfile {
  id: number;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface PublicProfileResponse {
  profile: PublicUserProfile;
}

export interface UserCollectionBase {
  id: string;
  userId: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCollectionSummary extends UserCollectionBase {
  storiesCount: number;
}

export interface UserCollectionDetail extends UserCollectionBase {
  stories: StoryListItem[];
}

export interface UserCollectionsResponse {
  items: UserCollectionSummary[];
}

export interface UserCollectionResponse {
  collection: UserCollectionDetail;
}
