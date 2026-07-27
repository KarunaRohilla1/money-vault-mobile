import type { WishlistCategoryApi } from "@/services/api/types";

export function moveWishlistCategory(categories: WishlistCategoryApi[], categoryId: number, direction: "down" | "up") {
  const index = categories.findIndex((category) => category.id === categoryId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= categories.length) {
    return categories;
  }

  const next = [...categories];
  const [moved] = next.splice(index, 1);
  if (!moved) return categories;
  next.splice(targetIndex, 0, moved);
  return next.map((category, sortOrder) => ({ ...category, sortOrder }));
}

export function categoryDeleteFallback(categories: WishlistCategoryApi[], deletingId: number) {
  return categories.find((category) => category.id !== deletingId)?.name ?? "Uncategorized";
}
