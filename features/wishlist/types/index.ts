import type { WishlistImageSourceApi, WishlistPriorityApi } from "@/services/api/types";

export type WishlistSortKey = "recent" | "priority" | "cost_desc" | "cost_asc" | "alpha";

export interface WishlistItemFormValues {
  categoryId: number | null;
  categoryName: string;
  estimatedCost: string;
  imageSource: WishlistImageSourceApi | null;
  imageUrl: string;
  name: string;
  notes: string;
  priority: WishlistPriorityApi;
  purchaseLink: string;
}

export interface WishlistCategoryFormValues {
  color: string;
  icon: string;
  id: number | null;
  name: string;
}
