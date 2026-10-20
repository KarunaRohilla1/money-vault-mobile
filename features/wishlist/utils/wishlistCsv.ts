import type { WishlistItemApi } from "@/services/api/types";

const headers = ["Item Name", "Category", "Priority", "Status", "Target Amount", "Purchased Amount", "Purchased Date", "Purchase Link", "Notes", "Date Added"];

export function wishlistItemsToCsv(items: WishlistItemApi[]) {
  const rows = items.map((item) => [
    item.name,
    item.category,
    item.priority,
    item.status ?? "ACTIVE",
    String(item.estimatedCost),
    item.purchasedAmount != null ? String(item.purchasedAmount) : "",
    item.purchasedDate ?? "",
    item.purchaseLink ?? "",
    item.notes ?? "",
    item.createdAt ?? ""
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
