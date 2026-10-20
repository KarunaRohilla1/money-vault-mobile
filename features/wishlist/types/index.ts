import type { WishlistImageSourceApi, WishlistPriorityApi } from "@/services/api/types";

export type WishlistSortKey = "recent" | "priority" | "cost_desc" | "cost_asc" | "alpha";

export type WishlistTab = "active" | "history";

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

export interface CompleteWishlistItemFormValues {
  purchasedAmount: string;
  purchasedDate: string;
}

export interface WishlistCategoryFormValues {
  color: string;
  icon: string;
  id: number | null;
  name: string;
}
