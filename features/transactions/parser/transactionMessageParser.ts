import type { AccountApi, CategoryApi } from "@/services/api/types";

export type ParsedTransactionType = "expense" | "income" | "unknown";

export interface ParsedTransactionMessage {
  accountLast4: string | null;
  amount: number | null;
  categoryHint: string | null;
  channel: string | null;
  confidence: "high" | "medium" | "low";
  date: string | null;
  merchant: string | null;
  notes: string | null;
  reference: string | null;
  time: string | null;
  type: ParsedTransactionType;
  warnings: string[];
}

export interface TransactionPrefillValues {
  accountId?: number;
  amount?: string;
  categoryId?: number;
  date?: string;
  notes?: string;
  transactionType?: "Expense" | "Income";
  warnings: string[];
}

const amountPattern = /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.\d{1,2})?)|(?:amount|amt)\s*(?:of|is|:)?\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi;
const balanceContextPattern = /\b(?:bal|balance|avl|available|limit|outstanding|closing)\b/i;
const transactionContextPattern = /\b(?:debited|debit|spent|paid|purchase|credited|credit|received|refund|sent|withdrawn|transferred)\b/i;
const referencePattern = /\b(?:ref(?:erence)?(?:\s*no)?|utr|txn(?:\s*id)?|transaction\s*id|rrn)\s*[:#-]?\s*([a-z0-9/-]{4,})\b/i;
const timePattern = /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*(am|pm))?\b/i;
const last4Patterns = [
  /\b(?:a\/c|acct|account|card|xx|x{2,}|ending|ends)\D{0,12}(\d{4})\b/i,
  /\b(?:\d{2,}x+|x+)(\d{4})\b/i
];

const monthLookup: Record<string, number> = {
  apr: 4,
  april: 4,
  aug: 8,
  august: 8,
  dec: 12,
  december: 12,
  feb: 2,
  february: 2,
  jan: 1,
  january: 1,
  jul: 7,
  july: 7,
  jun: 6,
  june: 6,
  mar: 3,
  march: 3,
  may: 5,
  nov: 11,
  november: 11,
  oct: 10,
  october: 10,
  sep: 9,
  sept: 9,
  september: 9
};

const categoryAliases: Record<string, string[]> = {
  "Bills & Utilities": ["bill", "electricity", "utility", "recharge", "mobile", "broadband", "gas", "water"],
  "Food & Dining": ["food", "dining", "restaurant", "coffee", "swiggy", "zomato", "starbucks", "cafe"],
  Fuel: ["fuel", "petrol", "diesel", "indian oil", "hpcl", "bpcl"],
  Groceries: ["grocery", "groceries", "dmart", "blinkit", "zepto", "bigbasket"],
  Income: ["salary", "credited", "credit", "received", "refund", "income"],
  Shopping: ["shopping", "amazon", "flipkart", "myntra", "purchase"],
  Transport: ["uber", "ola", "metro", "transport", "cab", "train", "bus"]
};

export function parseTransactionMessage(input: string): ParsedTransactionMessage {
  const message = normalizeMessage(input);
  const warnings: string[] = [];

  if (!message) {
    return emptyParse(["empty-message"]);
  }

  const type = parseTransactionType(message);
  const amount = parseAmount(message, warnings);
  const date = parseDate(message, warnings);
  const time = parseTime(message);
  const merchant = parseMerchant(message);
  const reference = parseReference(message);
  const channel = parseChannel(message);
  const accountLast4 = parseAccountLast4(message);
  const categoryHint = inferCategoryHint(message, merchant, type);
  const notes = buildDetectedNotes({ channel, merchant, reference });
  const confidence = resolveConfidence(type, amount, merchant, accountLast4, date, warnings);

  return {
    accountLast4,
    amount,
    categoryHint,
    channel,
    confidence,
    date,
    merchant,
    notes,
    reference,
    time,
    type,
    warnings
  };
}

export function buildTransactionPrefill(
  parsed: ParsedTransactionMessage,
  accounts: AccountApi[],
  categories: CategoryApi[],
  currentNotes: string
): TransactionPrefillValues {
  const warnings = [...parsed.warnings];
  const prefill: TransactionPrefillValues = { warnings };
  const accountId = matchParsedAccount(parsed, accounts);
  const transactionType = parsed.type === "income" ? "Income" : parsed.type === "expense" ? "Expense" : undefined;
  const categoryId = matchParsedCategory(parsed, categories, transactionType);

  if (accountId !== null) {
    prefill.accountId = accountId;
  } else if (parsed.accountLast4 || parsed.merchant) {
    warnings.push("account-not-matched");
  }

  if (parsed.amount !== null) {
    prefill.amount = formatAmount(parsed.amount);
  }

  if (parsed.date !== null) {
    prefill.date = parsed.date;
  }

  if (transactionType) {
    prefill.transactionType = transactionType;
  }

  if (categoryId !== null) {
    prefill.categoryId = categoryId;
  } else if (parsed.categoryHint) {
    warnings.push("category-not-matched");
  }

  prefill.notes = mergeNotes(currentNotes, parsed);

  return prefill;
}

export function matchParsedAccount(parsed: ParsedTransactionMessage, accounts: AccountApi[]): number | null {
  const activeAccounts = accounts;

  if (parsed.accountLast4) {
    const last4Matches = activeAccounts.filter((account) => normalizeDigits(account.name).includes(parsed.accountLast4 ?? ""));
    if (last4Matches.length === 1) {
      return last4Matches[0]?.id ?? null;
    }
  }

  if (parsed.merchant) {
    const merchantKey = normalizeWords(parsed.merchant);
    const nameMatches = activeAccounts.filter((account) => {
      const accountKey = normalizeWords(account.name);
      return accountKey.length > 2 && (merchantKey.includes(accountKey) || accountKey.includes(merchantKey));
    });
    if (nameMatches.length === 1) {
      return nameMatches[0]?.id ?? null;
    }
  }

  return null;
}

export function matchParsedCategory(
  parsed: ParsedTransactionMessage,
  categories: CategoryApi[],
  transactionType?: "Expense" | "Income"
): number | null {
  const candidates = categories.filter((category) => {
    if (!transactionType) {
      return true;
    }
    return transactionType === "Income" ? category.categoryType === "Income" : category.categoryType !== "Income";
  });
  const terms = [parsed.categoryHint, parsed.merchant].filter((term): term is string => Boolean(term)).map(normalizeWords);

  for (const category of candidates) {
    const categoryName = normalizeWords(category.name);
    const aliasTerms = categoryAliases[category.name] ?? [];
    const normalizedAliases = aliasTerms.map(normalizeWords);

    if (terms.some((term) => term === categoryName || normalizedAliases.includes(term))) {
      return category.id;
    }

    if (terms.some((term) => term.length > 2 && (term.includes(categoryName) || categoryName.includes(term)))) {
      return category.id;
    }

    if (normalizedAliases.some((alias) => terms.some((term) => term.includes(alias)))) {
      return category.id;
    }
  }

  return null;
}

function emptyParse(warnings: string[]): ParsedTransactionMessage {
  return {
    accountLast4: null,
    amount: null,
    categoryHint: null,
    channel: null,
    confidence: "low",
    date: null,
    merchant: null,
    notes: null,
    reference: null,
    time: null,
    type: "unknown",
    warnings
  };
}

function normalizeMessage(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function parseTransactionType(message: string): ParsedTransactionType {
  if (/\b(?:credited|credit|received|refund|salary deposited|salary credited)\b/i.test(message)) {
    return "income";
  }
  if (/\b(?:debited|debit|spent|paid|purchase|withdrawn|sent|transferred)\b/i.test(message)) {
    return "expense";
  }
  return "unknown";
}

function parseAmount(message: string, warnings: string[]) {
  const matches: { score: number; value: number }[] = [];

  for (const match of message.matchAll(amountPattern)) {
    const rawAmount = match[1] ?? match[2];
    if (!rawAmount) {
      continue;
    }

    const value = Number(rawAmount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    const contextStart = Math.max(0, match.index - 30);
    const contextEnd = Math.min(message.length, match.index + match[0].length + 30);
    const context = message.slice(contextStart, contextEnd);
    if (balanceContextPattern.test(context) && !transactionContextPattern.test(context)) {
      continue;
    }

    const score = transactionContextPattern.test(context) ? 2 : 1;
    matches.push({ score, value });
  }

  if (matches.length === 0) {
    warnings.push("amount-not-detected");
    return null;
  }

  const bestScore = Math.max(...matches.map((match) => match.score));
  const bestMatches = matches.filter((match) => match.score === bestScore);
  const uniqueValues = [...new Set(bestMatches.map((match) => match.value))];
  const allUniqueValues = [...new Set(matches.map((match) => match.value))];

  if (uniqueValues.length > 1 || allUniqueValues.length > 1) {
    warnings.push("amount-ambiguous");
  }

  return bestMatches[0]?.value ?? null;
}

function parseDate(message: string, warnings: string[]) {
  const slashDate = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/.exec(message);
  if (slashDate) {
    const day = Number(slashDate[1]);
    const month = Number(slashDate[2]);
    const year = normalizeYear(Number(slashDate[3]));
    const iso = toIsoDate(year, month, day);
    if (iso) {
      return iso;
    }
    warnings.push("date-invalid");
    return null;
  }

  const isoDate = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(message);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);
    const iso = toIsoDate(year, month, day);
    if (iso) {
      return iso;
    }
    warnings.push("date-invalid");
    return null;
  }

  const textDate = /\b(\d{1,2})[\s-]([A-Za-z]{3,9})[\s,-]+(\d{2,4})\b/.exec(message);
  if (textDate) {
    const day = Number(textDate[1]);
    const monthText = textDate[2]?.toLowerCase() ?? "";
    const month = monthLookup[monthText] ?? 0;
    const year = normalizeYear(Number(textDate[3]));
    const iso = toIsoDate(year, month, day);
    if (iso) {
      return iso;
    }
    warnings.push("date-invalid");
  }

  return null;
}

function parseTime(message: string) {
  const match = timePattern.exec(message);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toLowerCase();
  const adjustedHour = suffix === "pm" && hour < 12 ? hour + 12 : suffix === "am" && hour === 12 ? 0 : hour;
  return `${String(adjustedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseMerchant(message: string) {
  const merchantPatterns = [
    /\b(?:credited from|received from|from)\s+([a-z0-9 &._'-]{3,60}?)(?=\s+(?:on|via|ref|utr|txn|using|to|a\/c|account|card|rs|inr|₹)|[.!,]|$)/i,
    /\b(?:paid to|sent to|at|to)\s+([a-z0-9 &._'-]{3,60}?)(?=\s+(?:on|via|ref|utr|txn|using|from|a\/c|account|card|rs|inr|₹)|[.!,]|$)/i,
    /\bmerchant\s*[:#-]?\s*([a-z0-9 &._'-]{3,60})/i
  ];

  for (const pattern of merchantPatterns) {
    const match = pattern.exec(message);
    const merchant = cleanMerchant(match?.[1]?.trim() ?? "");
    if (merchant) {
      return titleCase(merchant);
    }
  }

  return null;
}

function parseReference(message: string) {
  return referencePattern.exec(message)?.[1] ?? null;
}

function parseChannel(message: string) {
  const match = /\b(upi|imps|neft|rtgs|pos|atm|netbanking|net banking|card)\b/i.exec(message);
  return match?.[1]?.replace(/\s+/g, " ").toUpperCase() ?? null;
}

function parseAccountLast4(message: string) {
  for (const pattern of last4Patterns) {
    const match = pattern.exec(message);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function inferCategoryHint(message: string, merchant: string | null, type: ParsedTransactionType) {
  if (type === "income") {
    return "Income";
  }

  const text = normalizeWords(`${message} ${merchant ?? ""}`);
  for (const [category, aliases] of Object.entries(categoryAliases)) {
    if (category === "Income") {
      continue;
    }
    if (aliases.some((alias) => text.includes(normalizeWords(alias)))) {
      return category;
    }
  }

  return null;
}

function buildDetectedNotes(values: { channel: string | null; merchant: string | null; reference: string | null }) {
  const parts = [
    values.merchant ? `Merchant: ${values.merchant}` : null,
    values.reference ? `Reference: ${values.reference}` : null,
    values.channel ? `Channel: ${values.channel}` : null
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join("\n") : null;
}

function mergeNotes(currentNotes: string, parsed: ParsedTransactionMessage) {
  const noteParts = [currentNotes.trim(), parsed.notes].filter((part): part is string => Boolean(part));
  if (parsed.time) {
    noteParts.push(`Time: ${parsed.time}`);
  }
  return [...new Set(noteParts)].join("\n");
}

function formatAmount(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function resolveConfidence(
  type: ParsedTransactionType,
  amount: number | null,
  merchant: string | null,
  accountLast4: string | null,
  date: string | null,
  warnings: string[]
): ParsedTransactionMessage["confidence"] {
  const score =
    (type !== "unknown" ? 2 : 0) + (amount !== null ? 3 : 0) + (merchant ? 1 : 0) + (accountLast4 ? 1 : 0) + (date ? 1 : 0);

  if (warnings.includes("amount-ambiguous")) {
    return "medium";
  }
  if (score >= 5) {
    return "high";
  }
  if (score >= 3) {
    return "medium";
  }
  return "low";
}

function normalizeYear(year: number) {
  if (year < 100) {
    return year + 2000;
  }
  return year;
}

function toIsoDate(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || year < 1900 || month < 1 || month > 12) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cleanMerchant(merchant: string) {
  return merchant.replace(/\b(?:rs|inr|ref|utr|txn|transaction|a\/c|account|card)\b.*$/i, "").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    return value;
  }
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}` : part))
    .join(" ");
}

function normalizeDigits(value: string) {
  return value.toLowerCase().replace(/\D/g, "");
}

function normalizeWords(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
