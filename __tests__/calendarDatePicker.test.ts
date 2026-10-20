import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";
import { daysInMonth, isoDateFromParts, isoDateParts } from "@/lib/date";

jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: "MaterialCommunityIcons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: () => ({ bottom: 24, top: 24 })
}));

describe("CalendarDatePicker", () => {
  it("is defined as a component", () => {
    expect(CalendarDatePicker).toBeDefined();
    expect(typeof CalendarDatePicker).toBe("function");
  });

  it("calculates correct start day of week and days in month", () => {
    // October 2026
    const parts = { year: 2026, month: 10, day: 18 };
    const numDays = daysInMonth(parts.year, parts.month);
    expect(numDays).toBe(31);

    // Oct 1 2026 is a Thursday (index 4: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu)
    const startDow = new Date(parts.year, parts.month - 1, 1).getDay();
    expect(startDow).toBe(4);

    // Total cells in grid = ceil((4 + 31) / 7) * 7 = 35 (5 full rows of 7 days)
    const totalCells = Math.ceil((startDow + numDays) / 7) * 7;
    expect(totalCells).toBe(35);
  });

  it("calculates leap year February correctly", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    const startDow2024 = new Date(2024, 1, 1).getDay(); // Thu = 4
    expect(startDow2024).toBe(4);
    // (4 + 29) = 33 -> 35 cells (5 rows)
    expect(Math.ceil((startDow2024 + 29) / 7) * 7).toBe(35);

    // Non-leap year February 2026 (28 days)
    expect(daysInMonth(2026, 2)).toBe(28);
    const startDow2026 = new Date(2026, 1, 1).getDay(); // Sun = 0
    expect(startDow2026).toBe(0);
    // (0 + 28) = 28 cells (exact 4 rows)
    expect(Math.ceil((startDow2026 + 28) / 7) * 7).toBe(28);
  });

  it("generates correct ISO date strings from day selections", () => {
    expect(isoDateFromParts(2026, 10, 5)).toBe("2026-10-05");
    expect(isoDateFromParts(2026, 10, 18)).toBe("2026-10-18");
    expect(isoDateParts("2026-10-18")).toEqual({ day: 18, month: 10, year: 2026 });
  });
});
