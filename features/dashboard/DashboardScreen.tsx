import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { recentActivityDirection, recentActivitySignedAmount } from "@/features/dashboard/activityDirection";
import { useDashboardQuery } from "@/features/dashboard/api";
import {
  dashboardLayout,
  dashboardComfortCopy,
  dashboardMetricLabels,
  dashboardTypography,
  dashboardWidthRules,
  formatDashboardMoney,
  singleLineMoneyProps
} from "@/features/dashboard/dashboardLayout";
import { getDashboardScreenState, shouldClearDashboardSession } from "@/features/dashboard/state";
import type { DashboardViewModel } from "@/features/dashboard/types";
import { clearBackendSession } from "@/services/api/session";
import type { CategorySpendApi, RecentActivityApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

const chartColors = [
  theme.colors.accent.rose,
  theme.colors.state.warning,
  theme.colors.brand.soft,
  theme.colors.state.info,
  theme.colors.accent.emerald,
  theme.colors.text.subtle
];

const legendDotClasses = [
  "bg-accent-rose",
  "bg-state-warning",
  "bg-brand-soft",
  "bg-state-info",
  "bg-accent-emerald",
  "bg-text-subtle"
];

interface MoneyTextProps {
  className?: string;
  currencyCode: CurrencyCode;
  locale: string;
  value: number;
}

export function MoneyText({ className, currencyCode, locale, value }: MoneyTextProps) {
  return (
    <Text className={className ?? dashboardTypography.metricMoney} {...singleLineMoneyProps}>
      {formatDashboardMoney(value, currencyCode, locale)}
    </Text>
  );
}

function chartColorAt(index: number) {
  return chartColors[index % chartColors.length] ?? theme.colors.brand.soft;
}

function legendDotClassAt(index: number) {
  return legendDotClasses[index % legendDotClasses.length] ?? "bg-brand-soft";
}

function greetingForDate(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function dateLabel(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

function DashboardLoading() {
  return (
    <Screen>
      <LoadingSkeleton />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </Screen>
  );
}

function DashboardSectionHeader({ action, title }: { action?: string; title: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={dashboardTypography.sectionTitle}>{title}</Text>
      {action ? (
        <View className="flex-row items-center gap-1">
          <Text className="font-sans text-sm font-semibold text-brand-soft">{action}</Text>
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.brand.soft} />
        </View>
      ) : null}
    </View>
  );
}

function IconTile({ icon, tone = "brand" }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; tone?: "brand" | "success" | "warning" | "danger" }) {
  const color = {
    brand: theme.colors.brand.soft,
    danger: theme.colors.accent.rose,
    success: theme.colors.state.success,
    warning: theme.colors.state.warning
  }[tone];

  return (
    <View className={dashboardLayout.iconTileClassName}>
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={color} />
    </View>
  );
}

function DashboardHeader({ dashboard, locale }: { dashboard: DashboardViewModel; locale: string }) {
  const initials = dashboard.vault.name.trim().slice(0, 2).toUpperCase() || "MV";
  const today = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", weekday: "long" }).format(new Date());

  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row flex-1 items-center gap-3">
        <View className="h-13 w-13 items-center justify-center rounded-full bg-brand-deep">
          <Text className="font-sans text-base font-bold text-brand-soft">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className={dashboardTypography.greeting} numberOfLines={1}>
            {greetingForDate()}, {dashboard.vault.name}
          </Text>
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
            {today}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.xs} color={theme.colors.brand.soft} />
            <Text className={dashboardTypography.caption} numberOfLines={1}>
              Day {dashboard.cycle.daysCompleted} of {dashboard.cycleLabel}
            </Text>
          </View>
        </View>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-full">
        <MaterialCommunityIcons name="bell-outline" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
      </View>
    </View>
  );
}

function CycleProgressGraph({ dashboard, graphWidth, locale }: { dashboard: DashboardViewModel; graphWidth: number; locale: string }) {
  const progress = clampPercent(dashboard.cycle.progressPercent);
  const markerX = 12 + (graphWidth - 24) * (progress / 100);
  const graphHeight = 78;
  const barWidth = graphWidth - 24;

  return (
    <View className="gap-2">
      <Svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
        <Path
          d={`M12 54 C ${graphWidth * 0.2} 50, ${graphWidth * 0.24} 39, ${graphWidth * 0.38} 42 S ${graphWidth * 0.55} 24, ${graphWidth * 0.68} 30 S ${graphWidth * 0.78} 14, ${graphWidth - 12} 12`}
          fill="none"
          stroke={theme.colors.brand.soft}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Path
          d={`M${graphWidth * 0.68} 30 C ${graphWidth * 0.78} 22, ${graphWidth * 0.86} 18, ${graphWidth - 12} 16`}
          fill="none"
          stroke={theme.colors.brand.soft}
          strokeDasharray="5 6"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path d={`M${markerX} 12 L${markerX} 64`} stroke={theme.colors.brand.muted} strokeDasharray="4 4" strokeWidth={1.5} />
        <Circle cx={markerX} cy={32} r={6} fill={theme.colors.text.DEFAULT} />
        <Circle cx={markerX} cy={32} r={4} fill={theme.colors.brand.DEFAULT} />
        <Rect x={12} y={66} width={barWidth} height={8} rx={4} fill={theme.colors.brand.deep} />
        <Rect x={12} y={66} width={barWidth * (progress / 100)} height={8} rx={4} fill={theme.colors.accent.emerald} />
      </Svg>
      <View className="flex-row justify-between">
        <Text className={dashboardTypography.caption}>{dateLabel(dashboard.cycle.startDate, locale)}</Text>
        <Text className={dashboardTypography.caption}>{dateLabel(dashboard.cycle.endDate, locale)}</Text>
      </View>
    </View>
  );
}

function SafeToSpendCard({
  currencyCode,
  dashboard,
  graphWidth,
  isNarrow,
  locale
}: {
  currencyCode: CurrencyCode;
  dashboard: DashboardViewModel;
  graphWidth: number;
  isNarrow: boolean;
  locale: string;
}) {
  const progress = clampPercent(dashboard.cycle.progressPercent);

  return (
    <View className={`${dashboardLayout.elevatedCardClassName} p-4`}>
      <View className="mb-3 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <Text className={dashboardTypography.cardTitle}>Safe to Spend</Text>
          <MaterialCommunityIcons name="information-outline" size={theme.icons.sm} color={theme.colors.text.muted} />
        </View>
        <View className="rounded-full bg-brand-deep px-3 py-1">
          <Text className="font-sans text-xs font-bold text-brand-soft">{Math.round(progress)}% of cycle</Text>
        </View>
      </View>
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-3">
          <MoneyText
            value={dashboard.safeToSpend}
            currencyCode={currencyCode}
            locale={locale}
            className={isNarrow ? "font-sans text-3xl font-bold text-text tabular-nums" : dashboardTypography.majorMoney}
          />
          <View className="flex-row items-start gap-2">
            <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.md} color={theme.colors.state.success} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-sm font-semibold text-state-success" numberOfLines={1}>
                {dashboardComfortCopy.headline}
              </Text>
              <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
                {dashboardComfortCopy.secondary}
              </Text>
            </View>
          </View>
        </View>
        <View className="shrink-0">
          <CycleProgressGraph dashboard={dashboard} graphWidth={graphWidth} locale={locale} />
        </View>
      </View>
    </View>
  );
}

function MetricCard({
  amount,
  currencyCode,
  icon,
  label,
  locale,
  tone = "brand"
}: {
  amount: number;
  currencyCode: CurrencyCode;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  locale: string;
  tone?: "brand" | "danger" | "success" | "warning";
}) {
  return (
    <View className="min-h-20 flex-1 flex-row items-center gap-2 rounded-lg border border-surface-border bg-surface p-3">
      <IconTile icon={icon} tone={tone} />
      <View className="min-w-0 flex-1">
        <Text className={dashboardTypography.label} numberOfLines={2}>
          {label}
        </Text>
        <MoneyText value={amount} currencyCode={currencyCode} locale={locale} />
      </View>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.muted} />
    </View>
  );
}

function FullWidthMetricRow({ currencyCode, dashboard, locale }: { currencyCode: CurrencyCode; dashboard: DashboardViewModel; locale: string }) {
  const isSettled = dashboard.settlement.amount === 0;

  return (
    <View className="min-h-20 flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface p-3">
      <IconTile icon="account-group-outline" />
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          Shared Balance
        </Text>
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          {isSettled ? "All Settled" : dashboard.settlement.label}
        </Text>
      </View>
      <View className="max-w-32 items-end">
        <MoneyText value={dashboard.settlement.amount} currencyCode={currencyCode} locale={locale} className="font-sans text-lg font-semibold text-text tabular-nums" />
      </View>
    </View>
  );
}

function FinancialSnapshot({ currencyCode, dashboard, locale }: { currencyCode: CurrencyCode; dashboard: DashboardViewModel; locale: string }) {
  return (
    <View className={dashboardLayout.sectionGapClassName}>
      <DashboardSectionHeader title="Financial Snapshot" />
      <View className="gap-3">
        <View className="flex-row gap-3">
          <MetricCard amount={dashboard.primaryAccountBalance} currencyCode={currencyCode} icon="wallet-outline" label={dashboardMetricLabels[0]} locale={locale} />
          <MetricCard amount={dashboard.expensesThisCycle} currencyCode={currencyCode} icon="trending-up" label={dashboardMetricLabels[1]} locale={locale} tone="success" />
        </View>
        <View className="flex-row gap-3">
          <MetricCard amount={dashboard.remainingCommitments} currencyCode={currencyCode} icon="calendar-month-outline" label={dashboardMetricLabels[2]} locale={locale} tone="warning" />
          <MetricCard amount={dashboard.creditCardDue} currencyCode={currencyCode} icon="credit-card-outline" label={dashboardMetricLabels[3]} locale={locale} tone="danger" />
        </View>
        <FullWidthMetricRow currencyCode={currencyCode} dashboard={dashboard} locale={locale} />
      </View>
    </View>
  );
}

function ActivityRow({ currencyCode, item, locale }: { currencyCode: CurrencyCode; item: RecentActivityApi; locale: string }) {
  const direction = recentActivityDirection(item);
  const signedAmount = recentActivitySignedAmount(item);
  const isCredit = direction === "credit";
  const isDebit = direction === "debit";

  return (
    <View className="min-h-16 flex-row items-center border-b border-surface-border py-2.5 last:border-b-0">
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={isCredit ? "arrow-down" : isDebit ? "cart-outline" : "minus"} size={theme.icons.sm} color={isCredit ? theme.colors.state.success : theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {item.notes || item.categoryName}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.categoryName}
        </Text>
      </View>
      <View className="mx-2 max-w-24 flex-1 items-center">
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.accountName ?? ""}
        </Text>
      </View>
      <View className="max-w-28 items-end">
        <Text className={isCredit ? "font-sans text-sm font-semibold text-state-success tabular-nums" : isDebit ? "font-sans text-sm font-semibold text-accent-rose tabular-nums" : "font-sans text-sm font-semibold text-text-muted tabular-nums"} {...singleLineMoneyProps}>
          {isCredit ? "+" : isDebit ? "-" : ""}
          {formatDashboardMoney(Math.abs(signedAmount || item.amount), currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {dateLabel(item.date, locale)}
        </Text>
      </View>
    </View>
  );
}

function RecentActivity({ currencyCode, dashboard, locale }: { currencyCode: CurrencyCode; dashboard: DashboardViewModel; locale: string }) {
  return (
    <View className={dashboardLayout.sectionGapClassName}>
      <DashboardSectionHeader action="View all" title="Recent Activity" />
      {dashboard.recentActivity.length > 0 ? (
        <View className={`${dashboardLayout.cardClassName} px-4`}>
          {dashboard.recentActivity.map((item) => (
            <ActivityRow key={item.id} item={item} currencyCode={currencyCode} locale={locale} />
          ))}
        </View>
      ) : (
        <EmptyState icon="history" title="No recent activity" message="No qualifying recent transactions were returned." />
      )}
    </View>
  );
}

function DonutChart({ categories, currencyCode, locale }: { categories: CategorySpendApi[]; currencyCode: CurrencyCode; locale: string }) {
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
  const radius = 42;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.reduce<{ dash: number; gap: number; item: CategorySpendApi; offset: number }[]>((result, item) => {
    const previousDash = result.reduce((sum, segment) => sum + segment.dash, 0);
    const dash = total > 0 ? (item.amount / total) * circumference : 0;

    return [
      ...result,
      {
        dash,
        gap: circumference - dash,
        item,
        offset: -previousDash
      }
    ];
  }, []);

  if (total <= 0) {
    return (
      <View className="h-28 w-28 items-center justify-center rounded-full border border-surface-border">
        <Text className="font-sans text-xs text-text-muted">No spend</Text>
      </View>
    );
  }

  return (
    <View className="h-28 w-28 items-center justify-center">
      <Svg width={112} height={112} viewBox="0 0 112 112">
        <Circle cx={56} cy={56} r={radius} stroke={theme.colors.surface.border} strokeWidth={strokeWidth} fill="none" />
        {segments.map((segment, index) => (
          <Circle
            key={segment.item.categoryId ?? `${segment.item.name}-${index}`}
            cx={56}
            cy={56}
            r={radius}
            stroke={chartColorAt(index)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${segment.dash} ${segment.gap}`}
            strokeDashoffset={segment.offset}
            strokeLinecap="butt"
            rotation="-90"
            originX={56}
            originY={56}
          />
        ))}
      </Svg>
      <View className="absolute max-w-20 items-center">
        <Text className="font-sans text-sm font-bold text-text tabular-nums" {...singleLineMoneyProps}>
          {formatDashboardMoney(total, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted">Total</Text>
      </View>
    </View>
  );
}

function SpendingByCategory({ categories, currencyCode, locale }: { categories: CategorySpendApi[]; currencyCode: CurrencyCode; locale: string }) {
  const total = categories.reduce((sum, item) => sum + item.amount, 0);

  if (categories.length === 0) {
    return (
      <View className={dashboardLayout.sectionGapClassName}>
        <DashboardSectionHeader title="Spending by Category" />
        <EmptyState icon="chart-donut" title="No category spending" message="No category spending was returned for this cycle." />
      </View>
    );
  }

  return (
    <View className={dashboardLayout.sectionGapClassName}>
      <DashboardSectionHeader action="This Cycle" title="Spending by Category" />
      <View className={`${dashboardLayout.cardClassName} p-4`}>
        <View className="flex-row gap-4">
          <DonutChart categories={categories} currencyCode={currencyCode} locale={locale} />
          <View className="min-w-0 flex-1 justify-center gap-2.5">
            {categories.slice(0, 6).map((item, index) => {
              const percent = total > 0 ? Math.round((item.amount / total) * 100) : 0;

              return (
                <View key={item.categoryId ?? `${item.name}-${index}`} className="flex-row items-center gap-2">
                  <View className={`h-2.5 w-2.5 rounded-full ${legendDotClassAt(index)}`} />
                  <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="w-9 text-right font-sans text-xs text-text">{percent}%</Text>
                  <Text className="w-20 text-right font-sans text-xs text-text-muted tabular-nums" {...singleLineMoneyProps}>
                    {formatDashboardMoney(item.amount, currencyCode, locale)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function DashboardContent({ dashboard }: { dashboard: DashboardViewModel }) {
  const currencyCode = useSettingsStore((state) => state.currencyCode) as CurrencyCode;
  const locale = useSettingsStore((state) => state.locale);
  const { width } = useWindowDimensions();
  const widthRules = dashboardWidthRules(width);

  return (
    <Screen contentClassName={dashboardLayout.bottomClearanceClassName}>
      <DashboardHeader dashboard={dashboard} locale={locale} />
      <SafeToSpendCard dashboard={dashboard} currencyCode={currencyCode} graphWidth={widthRules.heroGraphWidth} isNarrow={widthRules.isNarrow} locale={locale} />
      <FinancialSnapshot dashboard={dashboard} currencyCode={currencyCode} locale={locale} />
      <RecentActivity dashboard={dashboard} currencyCode={currencyCode} locale={locale} />
      <SpendingByCategory categories={dashboard.categories} currencyCode={currencyCode} locale={locale} />
    </Screen>
  );
}

export function DashboardScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const query = useDashboardQuery(token, vaultId);
  const screenState = getDashboardScreenState({
    data: query.data,
    error: query.error,
    isError: query.isError,
    isLoading: query.isLoading,
    refetch: query.refetch
  });

  useEffect(() => {
    if (shouldClearDashboardSession(query.error)) {
      void clearBackendSession().finally(() => setSignedOut());
    }
  }, [query.error, setSignedOut]);

  if (screenState.kind === "loading") {
    return <DashboardLoading />;
  }

  if (screenState.kind === "error") {
    return (
      <Screen>
        <ErrorView message={screenState.message} onRetry={() => void screenState.onRetry()} />
      </Screen>
    );
  }

  if (screenState.kind === "empty") {
    return (
      <Screen>
        <EmptyState icon="view-dashboard-outline" title="No dashboard data" message="No dashboard data was returned for this vault." />
      </Screen>
    );
  }

  return <DashboardContent dashboard={screenState.dashboard} />;
}
