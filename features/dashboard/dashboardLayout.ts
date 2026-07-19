import type { CurrencyCode } from "@/types/domain";

export const dashboardTypography = {
  caption: "font-sans text-xs text-text-muted",
  cardTitle: "font-sans text-sm font-bold uppercase text-text",
  greeting: "font-sans text-lg font-semibold text-text",
  label: "font-sans text-xs text-text-muted",
  majorMoney: "font-sans text-4xl font-bold text-text tabular-nums",
  metricMoney: "font-sans text-xl font-semibold text-text tabular-nums",
  sectionTitle: "font-sans text-sm font-bold uppercase text-text-muted"
} as const;

export const dashboardLayout = {
  bottomClearanceClassName: "gap-5 pb-44",
  cardClassName: "rounded-xl border border-surface-border bg-surface",
  elevatedCardClassName: "rounded-xl border border-brand-muted bg-surface-raised",
  iconTileClassName: "h-9 w-9 items-center justify-center rounded-lg bg-brand-deep",
  sectionGapClassName: "gap-3"
} as const;

export const singleLineMoneyProps = {
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.68,
  numberOfLines: 1
} as const;

export const dashboardComfortCopy = {
  headline: "You're comfortable",
  secondary: "within your spending plan."
} as const;

export const dashboardMetricLabels = [
  "Available Balance",
  "Expenses This Cycle",
  "Remaining Commitments",
  "Credit Card Due"
] as const;

export const dashboardVisualRules = {
  categoryLabelsAreManualTruncated: false,
  settingsGearOverlayEnabled: false,
  showNeedsAttentionSection: false,
  showSavingsGoalSection: false
} as const;

export function formatDashboardMoney(value: number, currencyCode: CurrencyCode, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export function dashboardWidthRules(width: number) {
  return {
    heroGraphWidth: width < 380 ? 138 : 168,
    isNarrow: width < 380,
    snapshotUsesTwoColumns: width >= 360
  };
}
