import { formatCurrency } from "@/lib/format";

describe("formatCurrency", () => {
  it("uses INR and en-IN formatting when requested", () => {
    expect(formatCurrency(123456.78, "INR", "en-IN")).toBe("₹1,23,456.78");
  });
});
