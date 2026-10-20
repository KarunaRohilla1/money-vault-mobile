import { isValidIsoDate } from "@/lib/date";
import { currentMonthKey } from "@/features/transactions/transactionHistoryModel";
import type { AccountApi, CategoryApi, TransactionFiltersApi, TransactionHistoryItemApi } from "@/services/api/types";

export type SortFilter = "Newest" | "Oldest" | "Amount High" | "Amount Low";
export type TransactionTypeFilter = NonNullable<TransactionFiltersApi["transactionType"]>;
export type DatePreset = "This month" | "Last month" | "Last 30 days" | "Custom";

export interface AdvancedFilters {
  accountIds: string[];
  amountMax: string;
  amountMin: string;
  categoryIds: string[];
  dateFrom: string;
  dateTo: string;
  sharedOnly: boolean;
  sortBy: SortFilter;
}

export const EMPTY_FILTERS: AdvancedFilters = {
  accountIds: [],
  amountMax: "",
  amountMin: "",
  categoryIds: [],
  dateFrom: "",
  dateTo: "",
  sharedOnly: false,
  sortBy: "Newest"
};

export const sortOptions: { label: string; value: SortFilter }[] = [
  { label: "Newest first", value: "Newest" },
  { label: "Oldest first", value: "Oldest" },
  { label: "Highest amount", value: "Amount High" },
  { label: "Lowest amount", value: "Amount Low" }
];

export function clearFilters(): AdvancedFilters {
  return { ...EMPTY_FILTERS, accountIds: [], categoryIds: [] };
}

export function activeFilterCount(filters: AdvancedFilters, transactionType: TransactionTypeFilter = "All") {
  return [
    filters.accountIds.length > 0,
    filters.categoryIds.length > 0,
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
    Boolean(filters.amountMin),
    Boolean(filters.amountMax),
    filters.sharedOnly,
    filters.sortBy !== "Newest",
    transactionType !== "All"
  ].filter(Boolean).length;
}

export function toggleId(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

export function cloneFilters(filters: AdvancedFilters): AdvancedFilters {
  return {
    ...filters,
    accountIds: [...filters.accountIds],
    categoryIds: [...filters.categoryIds]
  };
}

export function dedupeCategoriesById(categories: CategoryApi[]) {
  const byId = new Map<number, CategoryApi>();

  for (const category of categories) {
    if (!byId.has(category.id)) {
      byId.set(category.id, category);
    }
  }

  return [...byId.values()];
}

export function selectedCategories(categories: CategoryApi[], categoryIds: string[]) {
  const ids = new Set(categoryIds);
  return dedupeCategoriesById(categories).filter((category) => ids.has(String(category.id)));
}

export function filterCategoriesForSearch(categories: CategoryApi[], search: string) {
  const normalized = search.trim().toLowerCase();
  const unique = dedupeCategoriesById(categories);

  if (!normalized) {
    return unique;
  }

  return unique.filter((category) => category.name.toLowerCase().includes(normalized));
}

export function validateAmountRange(filters: Pick<AdvancedFilters, "amountMax" | "amountMin">) {
  const min = parseOptionalAmount(filters.amountMin);
  const max = parseOptionalAmount(filters.amountMax);

  if (min.invalid || max.invalid) {
    return "Enter a valid non-negative amount.";
  }

  if (min.value !== null && max.value !== null && min.value > max.value) {
    return "Minimum amount cannot be greater than maximum.";
  }

  return null;
}

export function validateDateRange(filters: Pick<AdvancedFilters, "dateFrom" | "dateTo">) {
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return "From date cannot be after to date.";
  }

  return null;
}

export function monthDateRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const safeDate = Number.isInteger(year) && Number.isInteger(monthIndex) ? new Date(year, monthIndex, 1) : new Date();
  const start = new Date(safeDate.getFullYear(), safeDate.getMonth(), 1);
  const end = new Date(safeDate.getFullYear(), safeDate.getMonth() + 1, 0);

  return {
    from: formatDateInput(start),
    to: formatDateInput(end)
  };
}

export function lastMonthDateRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const end = new Date(reference.getFullYear(), reference.getMonth(), 0);

  return {
    from: formatDateInput(start),
    to: formatDateInput(end)
  };
}

export function lastThirtyDaysDateRange(reference = new Date()) {
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  return {
    from: formatDateInput(start),
    to: formatDateInput(end)
  };
}

export function applyDatePreset(filters: AdvancedFilters, preset: DatePreset, selectedMonth: string, reference = new Date()): AdvancedFilters {
  if (preset === "Custom") {
    return cloneFilters(filters);
  }

  const range = preset === "This month" ? monthDateRange(selectedMonth) : preset === "Last month" ? lastMonthDateRange(reference) : lastThirtyDaysDateRange(reference);

  return {
    ...cloneFilters(filters),
    dateFrom: range.from,
    dateTo: range.to
  };
}

export function formatDisplayDate(date: string, locale: string) {
  if (!date) {
    return "";
  }

  const [yearText, monthText, dayText] = date.split("-");
  const parsed = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

export function filterValidationError(filters: AdvancedFilters) {
  return validateDateRange(filters) ?? validateAmountRange(filters);
}

function parseOptionalAmount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { invalid: false, value: null };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { invalid: true, value: null };
  }

  return { invalid: false, value: parsed };
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDisplayValue(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function transactionDisplayText(item: TransactionHistoryItemApi) {
  const primary = firstNonEmpty(item.merchant, item.title, item.category, "Transaction");
  const category = item.type === "transfer" ? "Transfer" : firstNonEmpty(item.category);
  const secondary = category && normalizeDisplayValue(category) !== normalizeDisplayValue(primary) ? category : null;

  return {
    primary,
    secondary
  };
}

function firstNonEmpty(...values: (string | null | undefined)[]) {
  return values.map((value) => String(value ?? "").trim()).find((value) => value.length > 0) ?? "";
}

export function monthKeyFromParam(value: string | undefined, referenceDate = new Date()) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : currentMonthKey(referenceDate);
}

export function transactionFiltersFromRouteParams(params: { dateFrom?: string; dateTo?: string; month?: string }, referenceDate = new Date()) {
  const dateFrom = typeof params.dateFrom === "string" && isValidIsoDate(params.dateFrom) ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" && isValidIsoDate(params.dateTo) ? params.dateTo : "";

  return {
    filters: {
      ...EMPTY_FILTERS,
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {})
    } satisfies AdvancedFilters,
    month: monthKeyFromParam(params.month, referenceDate)
  };
}

export function toApiFilters(input: {
  accounts: AccountApi[];
  categories: CategoryApi[];
  filters: AdvancedFilters;
  month: string;
  search: string;
  transactionType: TransactionTypeFilter;
}): TransactionFiltersApi {
  const firstAccountId = input.filters.accountIds[0];
  const firstCategoryId = input.filters.categoryIds[0];
  const account = input.accounts.find((item) => String(item.id) === firstAccountId)?.name;
  const category = input.categories.find((item) => String(item.id) === firstCategoryId)?.name;
  const trimmedSearch = input.search.trim();
  const hasExplicitDateRange = Boolean(input.filters.dateFrom && input.filters.dateTo);

  return {
    ...(account ? { account } : {}),
    ...(input.filters.amountMax ? { amountMax: input.filters.amountMax } : {}),
    ...(input.filters.amountMin ? { amountMin: input.filters.amountMin } : {}),
    ...(category ? { category } : {}),
    ...(input.filters.dateFrom ? { dateFrom: input.filters.dateFrom } : {}),
    ...(input.filters.dateTo ? { dateTo: input.filters.dateTo } : {}),
    ...(hasExplicitDateRange ? {} : { month: input.month }),
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(input.filters.sharedOnly ? { sharedOnly: true } : {}),
    sortBy: input.filters.sortBy,
    transactionType: input.transactionType
  };
}
