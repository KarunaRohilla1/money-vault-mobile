import type { TransactionHistoryItemApi } from "@/services/api/types";

export type TransactionIconName =
  | "arrow-down-left"
  | "arrow-up-right"
  | "calendar-refresh-outline"
  | "car-outline"
  | "cash-plus"
  | "home-outline"
  | "medical-bag"
  | "movie-open-outline"
  | "receipt-text-outline"
  | "school-outline"
  | "silverware-fork-knife"
  | "swap-horizontal";

const categoryIconMap: { icon: TransactionIconName; keywords: string[] }[] = [
  { icon: "silverware-fork-knife", keywords: ["dining", "food", "meal", "restaurant", "coffee", "cafe", "groceries", "grocery"] },
  { icon: "calendar-refresh-outline", keywords: ["subscription", "recurring", "membership"] },
  { icon: "receipt-text-outline", keywords: ["bill", "invoice", "receipt", "shopping", "purchase"] },
  { icon: "car-outline", keywords: ["transport", "taxi", "ride", "fuel", "petrol", "travel"] },
  { icon: "home-outline", keywords: ["home", "rent", "housing", "utilities"] },
  { icon: "medical-bag", keywords: ["health", "medical", "doctor", "pharmacy"] },
  { icon: "school-outline", keywords: ["education", "school", "learning"] },
  { icon: "movie-open-outline", keywords: ["entertainment", "movie", "streaming"] },
  { icon: "cash-plus", keywords: ["salary", "income", "pay", "bonus"] }
];

export function transactionIconName(item: Pick<TransactionHistoryItemApi, "category" | "title" | "transactionType" | "type">): TransactionIconName {
  if (item.type === "transfer") {
    return "swap-horizontal";
  }

  const text = `${item.category} ${item.title} ${item.transactionType}`.toLowerCase();
  const matchedCategory = categoryIconMap.find((category) => category.keywords.some((keyword) => text.includes(keyword)));

  if (matchedCategory) {
    return matchedCategory.icon;
  }

  if (item.type === "income") {
    return "arrow-down-left";
  }

  return "arrow-up-right";
}
