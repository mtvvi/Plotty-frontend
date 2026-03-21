export type CatalogStatus = "in-progress" | "completed" | "frozen";
export type CatalogRating = "G" | "PG-13" | "R" | "NC-17";
export type CatalogSize = "mini" | "midi" | "maxi";
export type CatalogSort = "new" | "updates" | "popular" | "discussed" | "bookmarks";
export type CatalogView = "feed" | "tiles";

export interface CatalogQuery {
  q: string;
  fandom: string;
  status: CatalogStatus | "";
  rating: CatalogRating | "";
  size: CatalogSize | "";
  sort: CatalogSort;
  view: CatalogView;
  page: number;
}

export interface CatalogStoryCard {
  id: string;
  slug: string;
  title: string;
  fandom: string;
  pairing: string;
  excerpt: string;
  coverTone: string;
  status: CatalogStatus;
  rating: CatalogRating;
  size: CatalogSize;
  chapters: number;
  likes: number;
  comments: number;
  bookmarks: number;
  updatedLabel: string;
  authorAiHint?: string;
  tags: string[];
}

export interface CatalogStats {
  storiesMatched: number;
  updatedToday: number;
  liveReaders: number;
}

export interface AiPromoBlock {
  title: string;
  description: string;
  features: string[];
}

export interface TrendingFandom {
  id: string;
  name: string;
  stories: number;
}

export interface AuthorDraftTeaser {
  title: string;
  status: string;
  summary: string;
  actions: { label: string; href: string }[];
  highlights: string[];
}

export interface CatalogMetaResponse {
  stats: CatalogStats;
  aiPromo: AiPromoBlock;
  filterOptions: {
    fandoms: string[];
    statuses: { value: CatalogStatus; label: string }[];
    ratings: CatalogRating[];
    sizes: { value: CatalogSize; label: string }[];
    sortTabs: { value: CatalogSort; label: string }[];
  };
}

export interface CatalogResponse {
  items: CatalogStoryCard[];
  total: number;
  page: number;
  pageSize: number;
}

