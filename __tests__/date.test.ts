import { isValidIsoDate, todayLocalIso } from "@/lib/date";

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
});
