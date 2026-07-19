import { addMonthsToIsoDate, daysInMonth, formatIsoDateOnly, isoDateFromParts, isoDateParts, isValidIsoDate, todayLocalIso } from "@/lib/date";

describe("date utilities", () => {
  it.each(["2024-02-29", "2026-01-01", "2026-12-31"])("accepts real ISO date %s", (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });

  it.each(["2026-02-29", "2026-02-31", "2026-13-01", "2026-00-10", "2026-04-31", "2026-2-4", "", "   "])(
    "rejects invalid ISO date %s",
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    }
  );

  it("generates local calendar dates without UTC slicing", () => {
    expect(todayLocalIso(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
    expect(todayLocalIso(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(todayLocalIso(new Date(2024, 1, 29, 12, 0))).toBe("2024-02-29");
  });

  it("formats date-only values as local calendar dates", () => {
    expect(formatIsoDateOnly("2026-07-19", "en-IN")).toBe("19 Jul 2026");
    expect(formatIsoDateOnly("2024-02-29", "en-IN")).toBe("29 Feb 2024");
    expect(formatIsoDateOnly("2026-01-01", "en-IN")).toBe("1 Jan 2026");
    expect(formatIsoDateOnly("not-a-date", "en-IN")).toBe("not-a-date");
  });

  it("supports existing short dashboard date labels", () => {
    expect(formatIsoDateOnly("2026-07-19", "en-IN", { day: "numeric", month: "short" })).toBe("19 Jul");
  });

  it("builds constrained date-picker month values from ISO date parts", () => {
    expect(isoDateParts("2026-07-19")).toEqual({ day: 19, month: 7, year: 2026 });
    expect(isoDateParts("2026-02-31")).toBeNull();
    expect(isoDateFromParts(2026, 7, 9)).toBe("2026-07-09");
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(addMonthsToIsoDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToIsoDate("2024-01-31", 1)).toBe("2024-02-29");
  });
});
