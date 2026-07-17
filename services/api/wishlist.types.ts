export interface WishlistCategoryApi {
  id: number;
  name: string;
  vaultId: number;
}

export interface WishlistItemApi {
  accountId?: number | null;
  accountName?: string | null;
  category: string;
  estimatedCost: number;
  id: number;
  imageUrl: string;
  name: string;
  notes: string;
  progressPercent: number;
  savedAmount: number;
  targetDate?: string | null;
}

export interface WishlistSummaryApi {
  progress: number;
  totalCost: number;
  totalItems: number;
  totalSaved: number;
}

export interface WishlistApiResponse {
  categories: WishlistCategoryApi[];
  items: WishlistItemApi[];
  summary: WishlistSummaryApi;
}

export interface WishlistItemPayloadApi {
  accountId?: number | null;
  category: string;
  estimatedCost: number;
  imageUrl?: string;
  name: string;
  notes?: string;
  savedAmount?: number;
  targetDate?: string | null;
}
