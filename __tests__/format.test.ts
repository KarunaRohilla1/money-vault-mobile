import { formatCurrency } from "@/lib/format";

describe("formatCurrency", () => {
  it("uses INR and en-IN formatting when requested", () => {
    expect(formatCurrency(123456.78, "INR", "en-IN")).toBe("₹1,23,456.78");
  });

  it.each([
    [0, "₹0"],
    [1, "₹1"],
    [999, "₹999"],
    [1000, "₹1,000"],
    [10000, "₹10,000"],
    [100000, "₹1,00,000"],
    [1000000, "₹10,00,000"],
    [1234567.89, "₹12,34,567.89"],
    [100.5, "₹100.50"],
    [-3000, "-₹3,000"],
    [-3000.75, "-₹3,000.75"]
  ])("formats %s without losing decimal precision", (amount, expected) => {
    expect(formatCurrency(amount, "INR", "en-IN")).toBe(expected);
  });
});
