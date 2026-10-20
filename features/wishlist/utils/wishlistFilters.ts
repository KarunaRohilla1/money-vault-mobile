import type { WishlistCategoryApi, WishlistItemApi } from "@/services/api/types";
import type { WishlistSortKey, WishlistTab } from "@/features/wishlist/types";

const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export function isWishlistItemCompleted(item: WishlistItemApi) {
  return (item.status ?? "ACTIVE").toUpperCase() === "COMPLETED";
}

export function filterWishlistItems(
  items: WishlistItemApi[],
  categories: WishlistCategoryApi[],
  search: string,
  selectedCategoryId: number | "all",
  tab: WishlistTab = "active"
) {
  const term = search.trim().toLowerCase();
  const selectedCategory = selectedCategoryId === "all" ? null : categories.find((category) => category.id === selectedCategoryId) ?? null;

  return items.filter((item) => {
    const isCompleted = isWishlistItemCompleted(item);
    if (tab === "active" && isCompleted) {
      return false;
    }
    if (tab === "history" && !isCompleted) {
      return false;
    }
    if (selectedCategory && item.category !== selectedCategory.name && item.categoryId !== selectedCategory.id) {
      return false;
    }
    if (!term) return true;
    return [item.name, item.category, item.notes].some((value) => (value ?? "").toLowerCase().includes(term));
  });
}

export function getItemEffectiveCost(item: WishlistItemApi) {
  if (isWishlistItemCompleted(item) && item.purchasedAmount != null) {
    return item.purchasedAmount;
  }
  return item.estimatedCost;
}

export function sortWishlistItems(items: WishlistItemApi[], sort: WishlistSortKey) {
  return [...items].sort((left, right) => {
    if (sort === "priority") {
      return priorityRank[left.priority] - priorityRank[right.priority] || right.id - left.id;
    }
    if (sort === "cost_desc") {
      return getItemEffectiveCost(right) - getItemEffectiveCost(left);
    }
    if (sort === "cost_asc") {
      return getItemEffectiveCost(left) - getItemEffectiveCost(right);
    }
    if (sort === "alpha") {
      return left.name.localeCompare(right.name);
    }
    const rightDate = isWishlistItemCompleted(right) && right.purchasedDate ? right.purchasedDate : right.createdAt;
    const leftDate = isWishlistItemCompleted(left) && left.purchasedDate ? left.purchasedDate : left.createdAt;
    return dateValue(rightDate) - dateValue(leftDate) || right.id - left.id;
  });
}

function dateValue(value?: string | null) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : 0;
}
