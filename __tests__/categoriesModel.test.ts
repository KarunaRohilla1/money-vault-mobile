import {
  LEGACY_CATEGORY_ICONS,
  categoryCounts,
  categoryFormError,
  filterAndSortCategories,
  getCategoryIcon,
  hasCategoryChanges,
  normalizeCategoryPayload,
  validateCategoryForm
} from "@/features/categories/categoryModel";
import type { CategoryApi } from "@/services/api/types";

const iconValue = (label: string) => LEGACY_CATEGORY_ICONS.find((icon) => icon.label === label)?.emoji ?? "";

const coffeeEmoji = iconValue("Coffee");
const groceriesEmoji = iconValue("Groceries");
const homeEmoji = iconValue("Home");
const salaryEmoji = iconValue("Salary");

const categories: CategoryApi[] = [
  { categoryType: "Expense", emoji: coffeeEmoji, id: 1, isSystem: true, name: "Coffee", parentCategory: "Food & Drinks" },
  { categoryType: "Income", emoji: salaryEmoji, id: 2, isSystem: false, name: "Salary", parentCategory: null },
  { categoryType: "Expense", emoji: homeEmoji, id: 3, isSystem: false, name: "Rent", parentCategory: "Housing" },
  { categoryType: "Expense", emoji: groceriesEmoji, id: 4, isSystem: false, name: "Groceries", parentCategory: "Shopping" }
];

describe("category model", () => {
  it("counts all filter chips from backend category data", () => {
    expect(categoryCounts(categories)).toEqual({
      All: 4,
      Custom: 3,
      Expense: 3,
      Income: 1,
      System: 1
    });
  });

  it("counts system categories only when isSystem is the boolean true", () => {
    const looseCategories = [
      { categoryType: "Expense", emoji: coffeeEmoji, id: 1, isSystem: "false", name: "Coffee", parentCategory: "Food" },
      { categoryType: "income", emoji: salaryEmoji, id: 2, isSystem: false, name: "Salary", parentCategory: null },
      { categoryType: "Expense", emoji: LEGACY_CATEGORY_ICONS[0]?.emoji ?? "", id: 3, isSystem: true, name: "System", parentCategory: null }
    ] as unknown as CategoryApi[];

    expect(categoryCounts(looseCategories)).toEqual({
      All: 3,
      Custom: 2,
      Expense: 2,
      Income: 1,
      System: 1
    });
  });

  it("filters by name and category type", () => {
    expect(filterAndSortCategories(categories, { filter: "Expense", search: "cof", sort: "A_TO_Z" }).map((category) => category.name)).toEqual(["Coffee"]);
    expect(filterAndSortCategories(categories, { filter: "Income", search: "", sort: "A_TO_Z" }).map((category) => category.name)).toEqual(["Salary"]);
  });

  it("supports system and custom filters from the backend isSystem flag", () => {
    expect(filterAndSortCategories(categories, { filter: "System", search: "", sort: "A_TO_Z" }).map((category) => category.name)).toEqual(["Coffee"]);
    expect(filterAndSortCategories(categories, { filter: "Custom", search: "", sort: "A_TO_Z" }).map((category) => category.name)).toEqual([
      "Salary",
      "Rent",
      "Groceries"
    ]);
  });

  it("keeps the legacy order: custom first, then parent, then name, with system after custom", () => {
    expect(filterAndSortCategories(categories, { filter: "All", search: "", sort: "A_TO_Z" }).map((category) => category.name)).toEqual([
      "Salary",
      "Rent",
      "Groceries",
      "Coffee"
    ]);
  });

  it("uses the legacy empty-name validation copy", () => {
    expect(categoryFormError("  ")).toBe("Category name cannot be empty.");
    expect(categoryFormError("Groceries")).toBeNull();
  });

  it("requires category type and icon before saving", () => {
    expect(validateCategoryForm({ categoryType: null, emoji: null, id: null, name: "Utilities" }, categories)).toEqual({
      errors: {
        categoryType: "Select a category type.",
        emoji: "Select a category icon."
      },
      isValid: false
    });
  });

  it("validates exact name boundaries", () => {
    expect(validateCategoryForm({ categoryType: "Expense", emoji: coffeeEmoji, id: null, name: "A" }, categories).errors.name).toBe("Category name must be at least 2 characters.");
    expect(validateCategoryForm({ categoryType: "Expense", emoji: coffeeEmoji, id: null, name: "A".repeat(30) }, categories).errors.name).toBeUndefined();
    expect(validateCategoryForm({ categoryType: "Expense", emoji: coffeeEmoji, id: null, name: "A".repeat(31) }, categories).errors.name).toBe("Category name must be 30 characters or less.");
  });

  it("detects duplicate names within the selected category type", () => {
    expect(validateCategoryForm({ categoryType: "Expense", emoji: coffeeEmoji, id: null, name: " coffee " }, categories).errors.name).toBe("Category already exists.");
    expect(validateCategoryForm({ categoryType: "Income", emoji: coffeeEmoji, id: null, name: "Coffee" }, categories).errors.name).toBeUndefined();
    expect(validateCategoryForm({ categoryType: "Expense", emoji: coffeeEmoji, id: 1, name: "Coffee" }, categories).errors.name).toBeUndefined();
  });

  it("tracks unsaved form changes after trimming names", () => {
    const initial = { categoryType: "Expense", emoji: coffeeEmoji, id: 1, name: "Coffee" };

    expect(hasCategoryChanges(initial, { ...initial, name: " Coffee " })).toBe(false);
    expect(hasCategoryChanges(initial, { ...initial, categoryType: "Income" })).toBe(true);
    expect(hasCategoryChanges(initial, { ...initial, emoji: salaryEmoji })).toBe(true);
  });

  it("maps legacy emoji values to monochrome icon names", () => {
    expect(getCategoryIcon(coffeeEmoji)).toBe("coffee-outline");
    expect(getCategoryIcon({ emoji: "", name: "Rent" })).toBe("home-outline");
    expect(getCategoryIcon("unknown")).toBe("shape-outline");
  });

  it("normalizes payload without applying backend title casing locally", () => {
    expect(normalizeCategoryPayload({ categoryType: "Expense", emoji: groceriesEmoji, name: " groceries " })).toEqual({
      categoryType: "Expense",
      emoji: groceriesEmoji,
      name: "groceries"
    });
  });
});
