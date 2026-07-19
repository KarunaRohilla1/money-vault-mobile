import {
  buildTransactionPrefill,
  matchParsedAccount,
  matchParsedCategory,
  parseTransactionMessage
} from "@/features/transactions/parser/transactionMessageParser";
import type { AccountApi, CategoryApi } from "@/services/api/types";

const accounts: AccountApi[] = [
  { balance: 82300, id: 1, isPrimary: true, name: "HDFC Savings 1234", openingBalance: 80000, type: "Savings Account" },
  { balance: 24500, id: 2, isPrimary: false, name: "ICICI Savings", openingBalance: 20000, type: "Savings Account" }
];

const categories: CategoryApi[] = [
  { categoryType: "Expense", emoji: "☕", id: 10, isSystem: true, name: "Food & Dining" },
  { categoryType: "Expense", emoji: "🛒", id: 11, isSystem: true, name: "Groceries" },
  { categoryType: "Income", emoji: "💰", id: 12, isSystem: true, name: "Income" },
  { categoryType: "Expense", emoji: "⛽", id: 13, isSystem: true, name: "Fuel" }
];

describe("transaction message parser", () => {
  it("parses a debit SMS without treating balance as the transaction amount", () => {
    const parsed = parseTransactionMessage(
      "HDFC Bank: Rs.220.00 debited from A/c XX1234 on 10-Jul-26 at Starbucks Coffee. Avl Bal INR 82,300. Ref No 987654 UPI."
    );

    expect(parsed.type).toBe("expense");
    expect(parsed.amount).toBe(220);
    expect(parsed.date).toBe("2026-07-10");
    expect(parsed.time).toBeNull();
    expect(parsed.merchant).toBe("Starbucks Coffee");
    expect(parsed.accountLast4).toBe("1234");
    expect(parsed.reference).toBe("987654");
    expect(parsed.channel).toBe("UPI");
    expect(parsed.categoryHint).toBe("Food & Dining");
    expect(parsed.warnings).not.toContain("amount-ambiguous");
  });

  it("parses a credit SMS as income", () => {
    const parsed = parseTransactionMessage("INR 45,000 credited to account ending 1234 on 10/07/2026 from ACME Payroll Ref SAL2026");

    expect(parsed.type).toBe("income");
    expect(parsed.amount).toBe(45000);
    expect(parsed.date).toBe("2026-07-10");
    expect(parsed.merchant).toBe("ACME Payroll");
    expect(parsed.categoryHint).toBe("Income");
  });

  it("preserves leading zeroes in account last-four extraction", () => {
    const parsed = parseTransactionMessage("INR 500 debited from card XX0034 at Metro on 01-07-2026 Ref 00004567");

    expect(parsed.accountLast4).toBe("0034");
    expect(parsed.reference).toBe("00004567");
  });

  it("warns when the transaction amount is ambiguous", () => {
    const parsed = parseTransactionMessage("Paid INR 500 to Merchant. Another amount INR 600 was requested. Ref TEST123");

    expect(parsed.amount).toBe(500);
    expect(parsed.warnings).toContain("amount-ambiguous");
  });

  it("does not return invalid dates", () => {
    const parsed = parseTransactionMessage("INR 300 debited from A/c XX1234 on 31/02/2026 at Dmart.");

    expect(parsed.date).toBeNull();
    expect(parsed.warnings).toContain("date-invalid");
  });

  it("matches accounts and categories only from loaded vault data", () => {
    const parsed = parseTransactionMessage("Rs 220 debited from A/c XX1234 on 10-Jul-26 at Starbucks Coffee Ref ABC123");

    expect(matchParsedAccount(parsed, accounts)).toBe(1);
    expect(matchParsedCategory(parsed, categories, "Expense")).toBe(10);
  });

  it("builds prefill for supported transaction form fields", () => {
    const parsed = parseTransactionMessage("Rs 2,300 debited from A/c XX1234 on 08/07/2026 at DMart using UPI Ref DM1234");
    const prefill = buildTransactionPrefill(parsed, accounts, categories, "Existing note");

    expect(prefill).toMatchObject({
      accountId: 1,
      amount: "2300",
      categoryId: 11,
      date: "2026-07-08",
      transactionType: "Expense"
    });
    expect(prefill.notes).toContain("Existing note");
    expect(prefill.notes).toContain("Reference: DM1234");
    expect(prefill.notes).toContain("Channel: UPI");
  });

  it("leaves unsupported or unmatched fields for manual review", () => {
    const parsed = parseTransactionMessage("A message says INR 999 was spent at Unknown Shop.");
    const prefill = buildTransactionPrefill(parsed, accounts, categories, "");

    expect(prefill.accountId).toBeUndefined();
    expect(prefill.categoryId).toBeUndefined();
    expect(prefill.warnings).toContain("account-not-matched");
  });
});
