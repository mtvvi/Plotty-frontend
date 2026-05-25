export type SuggestedFandomStatus = "pending" | "approved" | "rejected";

export const FANDOM_DESCRIPTION_MAX_LENGTH = 3000;

export interface SuggestedFandom {
  id: string;
  userId: number;
  name: string;
  description: string;
  status: SuggestedFandomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedFandomsResponse {
  items: SuggestedFandom[];
}

export interface SuggestFandomPayload {
  name: string;
  description: string;
}
