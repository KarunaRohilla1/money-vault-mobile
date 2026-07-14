import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { MoneyCard } from "@/components/cards/MoneyCard";
import { StatCard } from "@/components/cards/StatCard";
import { Screen } from "@/components/layout/Screen";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { useDashboardQuery } from "@/features/dashboard/api";
import type { DashboardViewModel } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/format";
import { ApiClientError } from "@/services/api/client";
import { clearBackendSession } from "@/services/api/session";
import type { CategorySpendApi, RecentActivityApi } from "@/services/api/types";
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

function objectiveCopy(value: number) {
  if (value > 0) {
    return "You have money available after planned obligations.";
  }

  return "Your available plan is fully allocated for this cycle.";
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

function DonutChart({ categories }: { categories: CategorySpendApi[] }) {
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
  const radius = 48;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.reduce<{ dash: number; gap: number; item: CategorySpendApi; offset: number }[]>((result, item) => {
    const previousDash = result.reduce((sum, segment) => sum + segment.dash, 0);
    const dash = (item.amount / total) * circumference;

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
      <View className="h-32 w-32 items-center justify-center rounded-full border border-surface-border">
        <Text className="font-sans text-xs text-text-muted">No spend</Text>
      </View>
    );
  }

  return (
    <View className="h-32 w-32 items-center justify-center">
      <Svg width={128} height={128} viewBox="0 0 128 128">
        <Circle cx={64} cy={64} r={radius} stroke={theme.colors.surface.border} strokeWidth={strokeWidth} fill="none" />
        {segments.map((segment, index) => {
          return (
            <Circle
              key={segment.item.name}
              cx={64}
              cy={64}
              r={radius}
              stroke={chartColorAt(index)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${segment.dash} ${segment.gap}`}
              strokeDashoffset={segment.offset}
              strokeLinecap="butt"
              rotation="-90"
              originX={64}
              originY={64}
            />
          );
        })}
      </Svg>
      <View className="absolute items-center">
        <Text className="font-sans text-base font-bold text-text">{categories.length}</Text>
        <Text className="font-sans text-xs text-text-muted">Categories</Text>
      </View>
    </View>
  );
}

function ActivityRow({ item, currencyCode, locale }: { currencyCode: string; item: RecentActivityApi; locale: string }) {
  const isIncome = item.transactionType.toLowerCase().includes("income");

  return (
    <View className="flex-row items-center justify-between border-b border-surface-border py-3 last:border-b-0">
      <View className="flex-1">
        <Text className="font-sans text-sm font-semibold text-text">{item.notes || item.categoryName}</Text>
        <Text className="font-sans text-xs text-text-muted">{item.categoryName}</Text>
      </View>
      <View className="items-end">
        <Text className={isIncome ? "font-sans text-sm font-semibold text-state-success" : "font-sans text-sm font-semibold text-accent-rose"}>
          {isIncome ? "+" : "-"}
          {formatCurrency(item.amount, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted">{item.date}</Text>
      </View>
    </View>
  );
}

function SpendingByCategory({ categories, currencyCode, locale }: { categories: CategorySpendApi[]; currencyCode: string; locale: string }) {
  const total = categories.reduce((sum, item) => sum + item.amount, 0);

  if (categories.length === 0) {
    return (
      <Section title="Spending by Category">
        <EmptyState icon="chart-donut" title="No category spending" message="No category spending was returned for this cycle." />
      </Section>
    );
  }

  return (
    <Section title="Spending by Category">
      <View className="rounded-lg border border-surface-border bg-surface p-4">
        <View className="flex-row gap-4">
          <DonutChart categories={categories} />
          <View className="flex-1 justify-center gap-3">
            {categories.map((item, index) => {
              const percent = total > 0 ? Math.round((item.amount / total) * 100) : 0;

              return (
                <View key={item.name} className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 flex-row items-center gap-2">
                    <View className={`h-2.5 w-2.5 rounded-full ${legendDotClassAt(index)}`} />
                    <Text className="flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text className="font-sans text-xs text-text">{percent}%</Text>
                  <Text className="w-20 text-right font-sans text-xs text-text-muted">{formatCurrency(item.amount, currencyCode, locale)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Section>
  );
}

function DashboardContent({ dashboard }: { dashboard: DashboardViewModel }) {
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);

  return (
    <Screen contentClassName="gap-4 pb-28">
      <View className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name="account" size={theme.icons.lg} color={theme.colors.brand.soft} />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-xl font-semibold text-text">
            {greetingForDate()}, {dashboard.vault.name}
          </Text>
          <Text className="font-sans text-sm text-text-muted">{dashboard.cycleLabel}</Text>
        </View>
      </View>

      <MoneyCard label="Safe to Spend" value={dashboard.safeToSpend} currencyCode={currencyCode}>
        <Text className="font-sans text-sm text-text-muted">{objectiveCopy(dashboard.safeToSpend)}</Text>
      </MoneyCard>

      <Section title="Financial Snapshot">
        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatCard icon="wallet-outline" label="Primary Balance" value={formatCurrency(dashboard.primaryAccountBalance, currencyCode, locale)} />
            <StatCard icon="trending-down" label="Expenses This Cycle" value={formatCurrency(dashboard.expensesThisCycle, currencyCode, locale)} />
          </View>
          <View className="flex-row gap-3">
            <StatCard icon="calendar-check-outline" label="Remaining Commitments" value={formatCurrency(dashboard.remainingCommitments, currencyCode, locale)} />
            <StatCard icon="credit-card-outline" label="Credit Card Due" value={formatCurrency(dashboard.creditCardDue, currencyCode, locale)} />
          </View>
          <View className="rounded-md border border-surface-border bg-surface p-4">
            <Text className="font-sans text-xs text-text-muted">Shared Settlement</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-sans text-base font-semibold text-text">{dashboard.settlement.label}</Text>
              <CurrencyText value={dashboard.settlement.amount} currencyCode={currencyCode} locale={locale} className="text-lg font-semibold" />
            </View>
          </View>
        </View>
      </Section>

      <Section title="Recent Activity">
        {dashboard.recentActivity.length > 0 ? (
          <View className="rounded-lg border border-surface-border bg-surface px-4">
            {dashboard.recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} currencyCode={currencyCode} locale={locale} />
            ))}
          </View>
        ) : (
          <EmptyState icon="history" title="No recent activity" message="No qualifying recent transactions were returned." />
        )}
      </Section>

      <SpendingByCategory categories={dashboard.categories} currencyCode={currencyCode} locale={locale} />
    </Screen>
  );
}

export function DashboardScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const query = useDashboardQuery(token, vaultId);

  useEffect(() => {
    if (query.error instanceof ApiClientError && query.error.status === 401) {
      void clearBackendSession().finally(() => setSignedOut());
    }
  }, [query.error, setSignedOut]);

  if (query.isLoading) {
    return <DashboardLoading />;
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorView message="Dashboard is unavailable. Check your connection and try again." onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <EmptyState icon="view-dashboard-outline" title="No dashboard data" message="No dashboard data was returned for this vault." />
      </Screen>
    );
  }

  return <DashboardContent dashboard={query.data} />;
}
