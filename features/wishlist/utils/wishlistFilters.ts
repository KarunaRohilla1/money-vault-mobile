import type { WishlistCategoryApi, WishlistItemApi } from "@/services/api/types";
import type { WishlistSortKey } from "@/features/wishlist/types";

const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export function filterWishlistItems(items: WishlistItemApi[], categories: WishlistCategoryApi[], search: string, selectedCategoryId: number | "all") {
  const term = search.trim().toLowerCase();
  const selectedCategory = selectedCategoryId === "all" ? null : categories.find((category) => category.id === selectedCategoryId) ?? null;

  return items.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory.name && item.categoryId !== selectedCategory.id) {
      return false;
    }
    if (!term) return true;
    return [item.name, item.category, item.notes].some((value) => (value ?? "").toLowerCase().includes(term));
  });
}

export function sortWishlistItems(items: WishlistItemApi[], sort: WishlistSortKey) {
  return [...items].sort((left, right) => {
    if (sort === "priority") {
      return priorityRank[left.priority] - priorityRank[right.priority] || right.id - left.id;
    }
    if (sort === "cost_desc") {
      return right.estimatedCost - left.estimatedCost;
    }
    if (sort === "cost_asc") {
      return left.estimatedCost - right.estimatedCost;
    }
    if (sort === "alpha") {
      return left.name.localeCompare(right.name);
    }
    return dateValue(right.createdAt) - dateValue(left.createdAt) || right.id - left.id;
  });
}

function dateValue(value?: string | null) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : 0;
}
