import { pickWishlistGalleryImage } from "@/features/wishlist/services/imagePicker.service";
import { categoryDeleteFallback, moveWishlistCategory } from "@/features/wishlist/utils/wishlistCategories";
import { wishlistItemsToCsv } from "@/features/wishlist/utils/wishlistCsv";
import {
  filterWishlistItems,
  getItemEffectiveCost,
  isWishlistItemCompleted,
  sortWishlistItems
} from "@/features/wishlist/utils/wishlistFilters";
import { formatWishlistMoneyInput, parseWishlistMoney } from "@/features/wishlist/utils/wishlistMoney";
import {
  completeWishlistItemSchema,
  wishlistCategorySchema,
  wishlistItemSchema
} from "@/features/wishlist/validation/wishlistSchemas";
import type { WishlistCategoryApi, WishlistItemApi } from "@/services/api/types";
import * as ImagePicker from "expo-image-picker";

const categories: WishlistCategoryApi[] = [
  { color: "purple", icon: "monitor", id: 1, itemCount: 2, name: "Electronics", sortOrder: 0, vaultId: 1 },
  { color: "blue", icon: "airplane", id: 2, itemCount: 1, name: "Travel", sortOrder: 1, vaultId: 1 },
  { color: "green", icon: "book-open-page-variant-outline", id: 3, itemCount: 1, name: "Books", sortOrder: 2, vaultId: 1 }
];

const items: WishlistItemApi[] = [
  { category: "Electronics", categoryId: 1, createdAt: "2026-07-12", estimatedCost: 200000, id: 1, imageUrl: "", name: "MacBook Pro", notes: "work machine", priority: "HIGH", purchaseLink: "", status: "ACTIVE" },
  { category: "Books", categoryId: 3, createdAt: "2026-07-10", estimatedCost: 8000, id: 2, imageUrl: "", name: "Kindle", notes: "reading", priority: "HIGH", purchaseLink: "", status: "ACTIVE" },
  { category: "Travel", categoryId: 2, createdAt: "2026-07-05", estimatedCost: 100000, id: 3, imageUrl: "", name: "Trip to Japan", notes: "spring", priority: "MEDIUM", purchaseLink: "", status: "COMPLETED", purchasedAmount: 95000, purchasedDate: "2026-08-01" },
  { category: "Electronics", categoryId: 1, createdAt: "2026-07-02", estimatedCost: 100000, id: 4, imageUrl: "", name: "Sony A7 IV", notes: "camera", priority: "LOW", purchaseLink: "", status: "ACTIVE" },
  { category: "Books", categoryId: 3, createdAt: "2026-06-01", estimatedCost: 2500, id: 5, imageUrl: "", name: "Cookbook", notes: "recipes", priority: "LOW", purchaseLink: "", status: "COMPLETED", purchasedAmount: 2000, purchasedDate: "2026-06-15" }
];

describe("wishlist feature helpers", () => {
  it("parses and formats decimal money input", () => {
    expect(parseWishlistMoney("2,999.99")).toBe(2999.99);
    expect(parseWishlistMoney("199999.50")).toBe(199999.5);
    expect(parseWishlistMoney("850.75")).toBe(850.75);
    expect(formatWishlistMoneyInput("200000.987")).toBe("2,00,000.98");
  });

  it("identifies completed wishlist items correctly", () => {
    expect(isWishlistItemCompleted(items[0]!)).toBe(false);
    expect(isWishlistItemCompleted(items[2]!)).toBe(true);
    expect(isWishlistItemCompleted({ ...items[0]!, status: "completed" })).toBe(true);
  });

  it("filters items by active vs history tabs", () => {
    const active = filterWishlistItems(items, categories, "", "all", "active");
    expect(active.map((item) => item.name)).toEqual(["MacBook Pro", "Kindle", "Sony A7 IV"]);

    const history = filterWishlistItems(items, categories, "", "all", "history");
    expect(history.map((item) => item.name)).toEqual(["Trip to Japan", "Cookbook"]);
  });

  it("searches item name, category, and notes within active and history tabs", () => {
    expect(filterWishlistItems(items, categories, "camera", "all", "active").map((item) => item.name)).toEqual(["Sony A7 IV"]);
    expect(filterWishlistItems(items, categories, "books", "all", "active").map((item) => item.name)).toEqual(["Kindle"]);
    expect(filterWishlistItems(items, categories, "spring", "all", "history").map((item) => item.name)).toEqual(["Trip to Japan"]);
    expect(filterWishlistItems(items, categories, "recipes", "all", "history").map((item) => item.name)).toEqual(["Cookbook"]);
  });

  it("filters by wishlist category within active tab", () => {
    expect(filterWishlistItems(items, categories, "", 1, "active").map((item) => item.name)).toEqual(["MacBook Pro", "Sony A7 IV"]);
    expect(filterWishlistItems(items, categories, "", 3, "history").map((item) => item.name)).toEqual(["Cookbook"]);
  });

  it("computes effective cost for active vs completed items", () => {
    expect(getItemEffectiveCost(items[0]!)).toBe(200000);
    expect(getItemEffectiveCost(items[2]!)).toBe(95000);
  });

  it("sorts wishlist items", () => {
    const activeOnly = items.filter((item) => !isWishlistItemCompleted(item));
    expect(sortWishlistItems(activeOnly, "recent").map((item) => item.id)).toEqual([1, 2, 4]);
    expect(sortWishlistItems(activeOnly, "cost_desc").map((item) => item.id)).toEqual([1, 4, 2]);
    expect(sortWishlistItems(activeOnly, "cost_asc").map((item) => item.id)).toEqual([2, 4, 1]);
    expect(sortWishlistItems(activeOnly, "alpha").map((item) => item.id)).toEqual([2, 1, 4]);
    expect(sortWishlistItems(activeOnly, "priority").map((item) => item.id)).toEqual([2, 1, 4]);
  });

  it("sorts history items by actual purchase cost and date", () => {
    const historyOnly = items.filter((item) => isWishlistItemCompleted(item));
    expect(sortWishlistItems(historyOnly, "cost_desc").map((item) => item.name)).toEqual(["Trip to Japan", "Cookbook"]);
    expect(sortWishlistItems(historyOnly, "recent").map((item) => item.name)).toEqual(["Trip to Japan", "Cookbook"]);
  });

  it("validates required item fields, URLs, and notes", () => {
    expect(wishlistItemSchema.safeParse({ categoryId: 1, estimatedCost: "1,999.50", imageSource: "url", imageUrl: "https://example.com/a.png", name: "Phone", notes: "n", priority: "HIGH", purchaseLink: "https://example.com" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: 1, estimatedCost: "1,999.50", imageSource: "gallery", imageUrl: "file:///data/user/0/com.app/cache/photo.jpg", name: "Phone", notes: "n", priority: "HIGH", purchaseLink: "https://example.com" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: 1, estimatedCost: "1,999.50", imageSource: "gallery", imageUrl: "content://media/external/images/media/123", name: "Phone", notes: "n", priority: "HIGH", purchaseLink: "https://example.com" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: null, categoryName: "Gear", estimatedCost: "1,999.50", imageSource: null, imageUrl: "", name: "Phone", notes: "", priority: "HIGH", purchaseLink: "" }).success).toBe(true);
    expect(wishlistItemSchema.safeParse({ categoryId: null, categoryName: "", estimatedCost: "0", imageSource: null, imageUrl: "bad", name: "", notes: "x".repeat(301), priority: "HIGH", purchaseLink: "bad" }).success).toBe(false);
  });

  it("validates completion form fields", () => {
    expect(completeWishlistItemSchema.safeParse({ purchasedAmount: "1,950.00", purchasedDate: "2026-10-18" }).success).toBe(true);
    expect(completeWishlistItemSchema.safeParse({ purchasedAmount: "0", purchasedDate: "2026-10-18" }).success).toBe(true);
    expect(completeWishlistItemSchema.safeParse({ purchasedAmount: "-100", purchasedDate: "2026-10-18" }).success).toBe(false);
    expect(completeWishlistItemSchema.safeParse({ purchasedAmount: "invalid", purchasedDate: "2026-10-18" }).success).toBe(false);
    expect(completeWishlistItemSchema.safeParse({ purchasedAmount: "1500", purchasedDate: "not-a-date" }).success).toBe(false);
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

  it("exports wishlist CSV with status, target amount, and purchase details", () => {
    const csv = wishlistItemsToCsv([items[0]!, items[2]!]);
    expect(csv).toContain("Item Name,Category,Priority,Status,Target Amount,Purchased Amount,Purchased Date,Purchase Link,Notes,Date Added");
    expect(csv).toContain("MacBook Pro,Electronics,HIGH,ACTIVE,200000,,,,work machine,2026-07-12");
    expect(csv).toContain("Trip to Japan,Travel,MEDIUM,COMPLETED,100000,95000,2026-08-01,,spring,2026-07-05");
  });

  it("handles gallery image picking and permissions", async () => {
    const successResult = await pickWishlistGalleryImage();
    expect(successResult).toEqual({ status: "success", uri: "file:///mock/image.jpg" });

    jest.spyOn(ImagePicker, "requestMediaLibraryPermissionsAsync").mockResolvedValueOnce({
      canAskAgain: false,
      expires: "never",
      granted: false,
      status: ImagePicker.PermissionStatus?.DENIED ?? ("denied" as ImagePicker.PermissionStatus)
    });
    const deniedResult = await pickWishlistGalleryImage();
    expect(deniedResult).toEqual({ status: "permission_denied" });

    jest.spyOn(ImagePicker, "launchImageLibraryAsync").mockResolvedValueOnce({
      assets: null,
      canceled: true
    });
    const cancelledResult = await pickWishlistGalleryImage();
    expect(cancelledResult).toEqual({ status: "cancelled" });
  });
});
