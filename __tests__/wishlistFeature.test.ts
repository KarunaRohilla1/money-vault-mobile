import { categoryDeleteFallback, moveWishlistCategory } from "@/features/wishlist/utils/wishlistCategories";
import { wishlistItemsToCsv } from "@/features/wishlist/utils/wishlistCsv";
import { filterWishlistItems, sortWishlistItems } from "@/features/wishlist/utils/wishlistFilters";
import { formatWishlistMoneyInput, parseWishlistMoney } from "@/features/wishlist/utils/wishlistMoney";
import { wishlistCategorySchema, wishlistItemSchema } from "@/features/wishlist/validation/wishlistSchemas";
import type { WishlistCategoryApi, WishlistItemApi } from "@/services/api/types";

const categories: WishlistCategoryApi[] = [
  { color: "purple", icon: "monitor", id: 1, itemCount: 2, name: "Electronics", sortOrder: 0, vaultId: 1 },
  { color: "blue", icon: "airplane", id: 2, itemCount: 1, name: "Travel", sortOrder: 1, vaultId: 1 },
  { color: "green", icon: "book-open-page-variant-outline", id: 3, itemCount: 1, name: "Books", sortOrder: 2, vaultId: 1 }
];

const items: WishlistItemApi[] = [
  { category: "Electronics", categoryId: 1, createdAt: "2026-07-12", estimatedCost: 200000, id: 1, imageUrl: "", name: "MacBook Pro", notes: "work machine", priority: "HIGH", purchaseLink: "" },
  { category: "Books", categoryId: 3, createdAt: "2026-07-10", estimatedCost: 8000, id: 2, imageUrl: "", name: "Kindle", notes: "reading", priority: "HIGH", purchaseLink: "" },
  { category: "Travel", categoryId: 2, createdAt: "2026-07-05", estimatedCost: 100000, id: 3, imageUrl: "", name: "Trip to Japan", notes: "spring", priority: "MEDIUM", purchaseLink: "" },
  { category: "Electronics", categoryId: 1, createdAt: "2026-07-02", estimatedCost: 100000, id: 4, imageUrl: "", name: "Sony A7 IV", notes: "camera", priority: "LOW", purchaseLink: "" }
];

describe("wishlist feature helpers", () => {
  it("parses and formats decimal money input", () => {
    expect(parseWishlistMoney("2,999.99")).toBe(2999.99);
    expect(parseWishlistMoney("199999.50")).toBe(199999.5);
    expect(parseWishlistMoney("850.75")).toBe(850.75);
    expect(formatWishlistMoneyInput("200000.987")).toBe("2,00,000.98");
  });

  it("searches item name, category, and notes", () => {
    expect(filterWishlistItems(items, categories, "camera", "all").map((item) => item.name)).toEqual(["Sony A7 IV"]);
    expect(filterWishlistItems(items, categories, "books", "all").map((item) => item.name)).toEqual(["Kindle"]);
    expect(filterWishlistItems(items, categories, "spring", "all").map((item) => item.name)).toEqual(["Trip to Japan"]);
  });

  it("filters by wishlist category", () => {
    expect(filterWishlistItems(items, categories, "", 1).map((item) => item.name)).toEqual(["MacBook Pro", "Sony A7 IV"]);
  });

  it("sorts wishlist items", () => {
    expect(sortWishlistItems(items, "recent").map((item) => item.id)).toEqual([1, 2, 3, 4]);
    expect(sortWishlistItems(items, "cost_desc").map((item) => item.id)).toEqual([1, 3, 4, 2]);
    expect(sortWishlistItems(items, "cost_asc").map((item) => item.id)).toEqual([2, 3, 4, 1]);
    expect(sortWishlistItems(items, "alpha").map((item) => item.id)).toEqual([2, 1, 4, 3]);
    expect(sortWishlistItems(items, "priority").map((item) => item.id)).toEqual([2, 1, 3, 4]);
  });

  it("validates required item fields, URLs, and notes", () => {
    expect(wishlistItemSchema.safeParse({ categoryId: 1, estimatedCost: "1,999.50", imageSource: "url", imageUrl: "https://example.com/a.png", name: "Phone", notes: "n", priority: "HIGH", purchaseLink: "https://example.com" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: null, categoryName: "Gear", estimatedCost: "1,999.50", imageSource: null, imageUrl: "", name: "Phone", notes: "", priority: "HIGH", purchaseLink: "" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: null, categoryName: "", estimatedCost: "0", imageSource: null, imageUrl: "bad", name: "", notes: "x".repeat(301), priority: "HIGH", purchaseLink: "bad" }).success).toBe(false);
  });

  it("validates category names", () => {
    expect(wishlistCategorySchema.safeParse({ color: "purple", icon: "monitor", id: null, name: "Electronics" }).success).toBe(true);
    expect(wishlistCategorySchema.safeParse({ color: "purple", icon: "monitor", id: null, name: "" }).success).toBe(false);
  });

  it("reorders categories and chooses delete fallback", () => {
    expect(moveWishlistCategory(categories, 2, "up").map((category) => category.id)).toEqual([2, 1, 3]);
    expect(moveWishlistCategory(categories, 1, "up").map((category) => category.id)).toEqual([1, 2, 3]);
    expect(categoryDeleteFallback(categories, 1)).toBe("Travel");
  });

  it("exports wishlist CSV", () => {
    expect(wishlistItemsToCsv([items[0]!])).toContain("Item Name,Category,Priority,Estimated Cost,Purchase Link,Notes,Date Added");
    expect(wishlistItemsToCsv([items[0]!])).toContain("MacBook Pro,Electronics,HIGH,200000,,work machine,2026-07-12");
  });
});
