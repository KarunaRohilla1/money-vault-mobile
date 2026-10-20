import { dashboardTransactionPeriod } from "@/features/dashboard/dashboardTransactionPeriod";
import { financialCycleContaining } from "@/lib/financialCycle";
import { transactionFiltersFromRouteParams, toApiFilters } from "@/features/transactions/transactionFilterModel";
import { EMPTY_FILTERS } from "@/features/transactions/transactionFilterModel";

describe("financial cycle containing a date", () => {
  it("resolves dates after the start day into the cycle that includes today, not the previous calendar month", () => {
    expect(financialCycleContaining("2026-10-11", 20)).toEqual({
      startDate: "2026-09-20",
      endDate: "2026-10-20"
    });
  });

  it("starts a new cycle on the configured start day", () => {
    expect(financialCycleContaining("2026-10-20", 20)).toEqual({
      startDate: "2026-10-20",
      endDate: "2026-11-20"
    });
  });

  it("clamps the start day in shorter months", () => {
    expect(financialCycleContaining("2026-03-01", 31)).toEqual({
      startDate: "2026-02-28",
      endDate: "2026-03-31"
    });
  });
});

describe("dashboard transaction period", () => {
  it("opens the cycle containing today instead of the cycle start calendar month", () => {
    expect(
      dashboardTransactionPeriod(
        {
          startDate: "2026-09-20",
          endDate: "2026-10-20"
        },
        new Date(2026, 9, 11)
      )
    ).toEqual({
      dateFrom: "2026-09-20",
      dateTo: "2026-10-20",
      month: "2026-10"
    });
  });

  it("computes the containing cycle from the start day when today is outside the dashboard cycle", () => {
    expect(
      dashboardTransactionPeriod(
        {
          startDate: "2026-08-20",
          endDate: "2026-09-20"
        },
        new Date(2026, 9, 11)
      )
    ).toEqual({
      dateFrom: "2026-09-20",
      dateTo: "2026-10-20",
      month: "2026-10"
    });
  });
});

describe("transaction route period params", () => {
  it("keeps an explicit month from other screens without inventing a date range", () => {
    expect(transactionFiltersFromRouteParams({ month: "2026-09" }, new Date(2026, 9, 11))).toEqual({
      filters: EMPTY_FILTERS,
      month: "2026-09"
    });
  });

  it("applies an explicit cycle date range from the dashboard", () => {
    expect(
      transactionFiltersFromRouteParams(
        { dateFrom: "2026-09-20", dateTo: "2026-10-20", month: "2026-10" },
        new Date(2026, 9, 11)
      )
    ).toMatchObject({
      filters: {
        dateFrom: "2026-09-20",
        dateTo: "2026-10-20"
      },
      month: "2026-10"
    });
  });

  it("sends the cycle date range to the API instead of the previous calendar month", () => {
    expect(
      toApiFilters({
        accounts: [],
        categories: [],
        filters: { ...EMPTY_FILTERS, dateFrom: "2026-09-20", dateTo: "2026-10-20" },
        month: "2026-10",
        search: "",
        transactionType: "All"
      })
    ).toEqual({
      dateFrom: "2026-09-20",
      dateTo: "2026-10-20",
      sortBy: "Newest",
      transactionType: "All"
    });
  });
});
