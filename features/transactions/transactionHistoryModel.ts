import { todayLocalIso } from "@/lib/date";
import type { TransactionHistorySectionApi } from "@/services/api/types";

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, locale: string, includeYear = true) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, includeYear ? { month: "long", year: "numeric" } : { month: "long" }).format(
    new Date(year ?? new Date().getFullYear(), (monthNumber ?? 1) - 1, 1)
  );
}

function previousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return currentMonthKey(new Date(year ?? new Date().getFullYear(), (monthNumber ?? 1) - 2, 1));
}

export function buildMonths(oldestMonth: string | null | undefined, latestMonth: string | null | undefined) {
  const latest = latestMonth || currentMonthKey();
  const oldest = oldestMonth || latest;
  const months: string[] = [];
  let cursor = latest;

  while (cursor >= oldest) {
    months.push(cursor);
    cursor = previousMonth(cursor);
  }

  return months.length > 0 ? months : [currentMonthKey()];
}

export function groupMonthsByYear(months: string[], locale: string) {
  return months.reduce<{ months: { label: string; value: string }[]; year: string }[]>((groups, value) => {
    const year = value.slice(0, 4);
    const existing = groups.find((group) => group.year === year);
    const option = { label: monthLabel(value, locale, false), value };
    if (existing) {
      existing.months.push(option);
      return groups;
    }
    return [...groups, { months: [option], year }];
  }, []);
}

export function csvCell(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function transactionsToCsv(sections: TransactionHistorySectionApi[]) {
  const rows = sections.flatMap((section) => section.transactions);
  const header = ["Date", "Merchant", "Category", "Account", "Amount", "Type", "Notes", "Shared"];
  return [
    header.map(csvCell).join(","),
    ...rows.map((item) =>
      [
        item.date,
        item.merchant ?? item.title,
        item.category,
        item.account ?? item.transferMetadata?.toAccount ?? "",
        item.amount,
        item.transactionType,
        item.merchant ?? "",
        item.shared ? item.sharedVaultName ?? "Shared" : ""
      ].map(csvCell).join(",")
    )
  ].join("\n");
}

export function transactionCsvFilename(month: string) {
  return `money-vault-transactions-${month}-${todayLocalIso()}.csv`;
}
