import { z } from "zod";

import { parseWishlistMoney } from "@/features/wishlist/utils/wishlistMoney";

const optionalUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Enter a valid URL.");

const optionalImageUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url.href);
  } catch {
    return false;
  }
}, "Enter a valid image URL.");

export const wishlistItemSchema = z.object({
  categoryId: z.number().nullable().refine((value) => value !== null, "Category is required."),
  estimatedCost: z.string().refine((value) => {
    const amount = parseWishlistMoney(value);
    return Number.isFinite(amount) && amount > 0;
  }, "Estimated cost must be greater than zero."),
  imageSource: z.enum(["camera", "gallery", "url"]).nullable(),
  imageUrl: optionalImageUrl,
  name: z.string().trim().min(1, "Item name is required."),
  notes: z.string().max(300, "Notes must be 300 characters or less."),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  purchaseLink: optionalUrl
});

export const wishlistCategorySchema = z.object({
  color: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  id: z.number().nullable(),
  name: z.string().trim().min(1, "Category name is required.")
});
