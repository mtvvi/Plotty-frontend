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

export interface UserCollectionSummary {
  id: string;
  userId: number;
  title: string;
  description?: string | null;
  storiesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCollectionDetail extends Omit<UserCollectionSummary, "storiesCount"> {
  stories: StoryListItem[];
}

export interface UserCollectionsResponse {
  items: UserCollectionSummary[];
}

export interface UserCollectionResponse {
  collection: UserCollectionDetail;
}
