import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

import type { CategoryApi } from "@/services/api/types";

export type CategoryFilter = "All" | "Expense" | "Income" | "System" | "Custom";
export type CategorySort = "A_TO_Z";
export type CategoryIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface CategoryIconOption {
  emoji: string;
  group: "Common" | "Food" | "Home" | "Lifestyle" | "Money";
  icon: CategoryIconName;
  label: string;
}

export interface CategoryFormInput {
  categoryType: string | null;
  emoji: string | null;
  id: number | null;
  name: string;
}

export interface CategoryValidationResult {
  errors: {
    categoryType?: string;
    emoji?: string;
    name?: string;
  };
  isValid: boolean;
}

export const CATEGORY_FILTERS: CategoryFilter[] = ["All", "Expense", "Income", "System", "Custom"];

export const LEGACY_CATEGORY_ICONS: CategoryIconOption[] = [
  { emoji: "🏷️", group: "Common", icon: "shape-outline", label: "Default" },
  { emoji: "☕", group: "Food", icon: "coffee-outline", label: "Coffee" },
  { emoji: "🍔", group: "Food", icon: "hamburger", label: "Burger" },
  { emoji: "🍕", group: "Food", icon: "pizza", label: "Pizza" },
  { emoji: "🍽", group: "Food", icon: "silverware-fork-knife", label: "Dining Out" },
  { emoji: "🛵", group: "Food", icon: "moped-outline", label: "Food Delivery" },
  { emoji: "🛒", group: "Lifestyle", icon: "cart-outline", label: "Groceries" },
  { emoji: "🛍", group: "Lifestyle", icon: "shopping-outline", label: "Shopping" },
  { emoji: "🏠", group: "Home", icon: "home-outline", label: "Home" },
  { emoji: "💡", group: "Home", icon: "lightbulb-outline", label: "Utilities" },
  { emoji: "🚗", group: "Lifestyle", icon: "car-outline", label: "Car" },
  { emoji: "🚕", group: "Lifestyle", icon: "taxi", label: "Transport" },
  { emoji: "✈️", group: "Lifestyle", icon: "airplane", label: "Travel" },
  { emoji: "💊", group: "Lifestyle", icon: "pill", label: "Medical" },
  { emoji: "🎬", group: "Lifestyle", icon: "movie-open-outline", label: "Entertainment" },
  { emoji: "🏋️", group: "Lifestyle", icon: "weight-lifter", label: "Fitness" },
  { emoji: "💰", group: "Money", icon: "cash", label: "Money" },
  { emoji: "💼", group: "Money", icon: "briefcase-outline", label: "Salary" },
  { emoji: "📺", group: "Lifestyle", icon: "television-classic", label: "Subscriptions" },
  { emoji: "📦", group: "Common", icon: "package-variant-closed", label: "Miscellaneous" }
];

export const DEFAULT_CATEGORY_EMOJI = LEGACY_CATEGORY_ICONS[0]?.emoji ?? "tag";

const CATEGORY_NAME_ICON_ALIASES: { icon: CategoryIconName; match: string }[] = [
  { icon: "home-outline", match: "rent" },
  { icon: "silverware-fork-knife", match: "dining" },
  { icon: "moped-outline", match: "delivery" }
];

export function categoryCounts(categories: CategoryApi[]) {
  return {
    All: categories.length,
    Custom: categories.filter((category) => !isSystemCategory(category)).length,
    Expense: categories.filter((category) => categoryType(category) === "Expense").length,
    Income: categories.filter((category) => categoryType(category) === "Income").length,
    System: categories.filter(isSystemCategory).length
  } satisfies Record<CategoryFilter, number>;
}

export function categoryMatchesFilter(category: CategoryApi, filter: CategoryFilter) {
  if (filter === "All") {
    return true;
  }

  if (filter === "System") {
    return isSystemCategory(category);
  }

  if (filter === "Custom") {
    return !isSystemCategory(category);
  }

  return categoryType(category) === filter;
}

export function filterAndSortCategories(categories: CategoryApi[], input: { filter: CategoryFilter; search: string; sort: CategorySort }) {
  const normalizedSearch = input.search.trim().toLowerCase();

  return categories
    .filter((category) => categoryMatchesFilter(category, input.filter))
    .filter((category) => (normalizedSearch ? category.name.toLowerCase().includes(normalizedSearch) : true))
    .sort((left, right) => legacyCategorySort(left, right));
}

export function legacyCategorySort(left: CategoryApi, right: CategoryApi) {
  const systemSort = Number(isSystemCategory(left)) - Number(isSystemCategory(right));
  if (systemSort !== 0) {
    return systemSort;
  }

  const parentSort = (left.parentCategory ?? "").localeCompare(right.parentCategory ?? "", undefined, { sensitivity: "base" });
  if (parentSort !== 0) {
    return parentSort;
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

export function categoryFormError(name: string) {
  return validateCategoryName(name).name ?? null;
}

export function normalizeCategoryPayload(input: { categoryType: string; emoji: string; name: string }) {
  return {
    categoryType: input.categoryType,
    emoji: input.emoji.trim(),
    name: input.name.trim()
  };
}

export function isSystemCategory(category: Pick<CategoryApi, "isSystem">) {
  return category.isSystem === true;
}

export function categoryType(category: Pick<CategoryApi, "categoryType">) {
  return category.categoryType.toLowerCase() === "income" ? "Income" : "Expense";
}

export function getCategoryIcon(categoryOrEmoji: Pick<CategoryApi, "emoji" | "name"> | string | null | undefined): CategoryIconName {
  const emoji = typeof categoryOrEmoji === "string" ? categoryOrEmoji : categoryOrEmoji?.emoji;
  const name = typeof categoryOrEmoji === "string" ? "" : categoryOrEmoji?.name ?? "";
  const emojiMatch = LEGACY_CATEGORY_ICONS.find((option) => option.emoji === emoji);

  if (emojiMatch) {
    return emojiMatch.icon;
  }

  const normalizedName = name.toLowerCase();
  const nameMatch = LEGACY_CATEGORY_ICONS.find((option) => normalizedName.includes(option.label.toLowerCase()));
  const aliasMatch = CATEGORY_NAME_ICON_ALIASES.find((option) => normalizedName.includes(option.match));
  return nameMatch?.icon ?? aliasMatch?.icon ?? "shape-outline";
}

export function validateCategoryName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return { name: "Category name cannot be empty." };
  }

  if (trimmed.length < 2) {
    return { name: "Category name must be at least 2 characters." };
  }

  if (trimmed.length > 30) {
    return { name: "Category name must be 30 characters or less." };
  }

  return {};
}

export function validateCategoryForm(input: CategoryFormInput, categories: CategoryApi[]): CategoryValidationResult {
  const errors: CategoryValidationResult["errors"] = {
    ...validateCategoryName(input.name)
  };
  const type = input.categoryType ? categoryType({ categoryType: input.categoryType }) : null;
  const name = input.name.trim();

  if (!type) {
    errors.categoryType = "Select a category type.";
  }

  if (!input.emoji?.trim()) {
    errors.emoji = "Select a category icon.";
  }

  if (type && name) {
    const duplicate = categories.some((category) => {
      if (category.id === input.id) {
        return false;
      }

      return categoryType(category) === type && category.name.trim().toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
      errors.name = "Category already exists.";
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
}

export function hasCategoryChanges(initial: CategoryFormInput, current: CategoryFormInput) {
  return (
    initial.name.trim() !== current.name.trim() ||
    (initial.categoryType ?? "") !== (current.categoryType ?? "") ||
    (initial.emoji ?? "") !== (current.emoji ?? "")
  );
}
