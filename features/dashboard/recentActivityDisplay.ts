import type { RecentActivityApi } from "@/services/api/types";

function normalized(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function differsFromCategory(value: string, categoryName: string) {
  return value.toLocaleLowerCase() !== categoryName.trim().toLocaleLowerCase();
}

export function recentActivityPrimaryText(item: RecentActivityApi) {
  return item.categoryName;
}

export function recentActivitySecondaryText(item: RecentActivityApi) {
  const categoryName = item.categoryName;
  const candidates = [item.notes, item.merchant, item.description, item.transactionType];

  return candidates.map(normalized).find((candidate) => candidate.length > 0 && differsFromCategory(candidate, categoryName)) ?? "";
}
