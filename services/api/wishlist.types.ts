export type WishlistPriorityApi = "HIGH" | "MEDIUM" | "LOW";
export type WishlistImageSourceApi = "camera" | "gallery" | "url";

export interface WishlistCategoryApi {
  color: string;
  icon: string;
  id: number;
  itemCount: number;
  name: string;
  sortOrder: number;
  vaultId: number;
}

export interface WishlistItemApi {
  accountId?: number | null;
  accountName?: string | null;
  category: string;
  categoryId?: number | null;
  createdAt?: string | null;
  estimatedCost: number;
  id: number;
  imageSource?: WishlistImageSourceApi | null;
  imageUrl: string;
  name: string;
  notes: string;
  priority: WishlistPriorityApi;
  progressPercent?: number;
  purchaseLink: string;
  savedAmount?: number;
  targetDate?: string | null;
}

export interface WishlistSummaryApi {
  progress?: number;
  totalCost: number;
  totalItems: number;
  totalSaved?: number;
}

export interface WishlistApiResponse {
  categories: WishlistCategoryApi[];
  items: WishlistItemApi[];
  summary: WishlistSummaryApi;
}

export interface WishlistItemPayloadApi {
  accountId?: number | null;
  category: string;
  categoryId?: number | null;
  estimatedCost: number;
  imageSource?: WishlistImageSourceApi | null;
  imageUrl?: string;
  name: string;
  notes?: string;
  priority: WishlistPriorityApi;
  purchaseLink?: string;
}

export interface WishlistCategoryPayloadApi {
  color?: string;
  fallback?: string;
  icon?: string;
  name: string;
  sortOrder?: number;
}

export interface WishlistCategoryReorderPayloadApi {
  categories: { id: number; sortOrder: number }[];
}
