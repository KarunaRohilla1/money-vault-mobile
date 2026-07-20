import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Screen } from "@/components/layout/Screen";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useMarkSharedSettlementMutation, useSharedDashboardQuery } from "@/features/shared/api";
import { dashboardLayout, dashboardTypography, singleLineMoneyProps } from "@/features/dashboard/dashboardLayout";
import type {
  SharedDashboardParticipantApi,
  SharedDashboardRecentActivityApi,
  SharedDashboardSpendingCategoryApi,
  SharedSettlementItemApi
} from "@/services/api/types";
import { formatIsoDateOnly } from "@/lib/date";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

const chartColors = [
  theme.colors.brand.soft,
  theme.colors.accent.emerald,
  theme.colors.accent.rose,
  theme.colors.state.warning,
  theme.colors.state.info,
  theme.colors.text.subtle
];

const legendDotClasses = [
  "bg-brand-soft",
  "bg-accent-emerald",
  "bg-accent-rose",
  "bg-state-warning",
  "bg-state-info",
  "bg-text-subtle"
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currency(value: number, currencyCode: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function chartColorAt(index: number) {
  return chartColors[index % chartColors.length] ?? theme.colors.brand.soft;
}

function legendDotClassAt(index: number) {
  return legendDotClasses[index % legendDotClasses.length] ?? "bg-brand-soft";
}

function activeSettlementItem(items: SharedSettlementItemApi[]) {
  return items.find((item) => item.amount > 0 && item.from_accounts.length > 0 && item.to_accounts.length > 0) ?? null;
}

function SharedDashboardLoading() {
  return (
    <Screen>
      <LoadingSkeleton />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </Screen>
  );
}

function Header({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-3xl font-bold text-text" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-1 font-sans text-sm text-text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <PrimaryButton className="h-11 px-4" icon="plus" onPress={() => router.push("/transaction/new" as never)}>
        Add Expense
      </PrimaryButton>
    </View>
  );
}

function SettlementCard({
  canSettle,
  currencyCode,
  isSettling,
  label,
  locale,
  onSettle,
  paid,
  percentage,
  settlementAmount,
  share
}: {
  canSettle: boolean;
  currencyCode: string;
  isSettling: boolean;
  label: string;
  locale: string;
  onSettle: () => void;
  paid: number;
  percentage: number;
  settlementAmount: number;
  share: number;
}) {
  const progress = Math.min(100, Math.max(0, percentage));

  return (
    <View className={`${dashboardLayout.elevatedCardClassName} gap-4 p-4`}>
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className={dashboardTypography.cardTitle}>Settlement</Text>
          <Text className="mt-1 font-sans text-sm text-text-muted">{label}</Text>
        </View>
        <CurrencyText value={settlementAmount} currencyCode={currencyCode} locale={locale} className="text-2xl font-bold" />
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-brand-deep">
        <View className="h-full rounded-full bg-accent-emerald" style={{ width: `${progress}%` }} />
      </View>
      <View className="flex-row gap-3">
        <MiniMoney label="Paid" value={paid} currencyCode={currencyCode} locale={locale} />
        <MiniMoney label="Share" value={share} currencyCode={currencyCode} locale={locale} />
      </View>
      <SecondaryButton disabled={!canSettle || isSettling} onPress={onSettle}>
        Mark Settled
      </SecondaryButton>
    </View>
  );
}

function MiniMoney({ currencyCode, label, locale, value }: { currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="flex-1 rounded-lg border border-surface-border bg-background-muted p-3">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="text-base font-semibold" />
    </View>
  );
}

function SnapshotCard({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; value: string }) {
  return (
    <View className="min-h-20 flex-1 flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface p-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans text-base font-semibold text-text" {...singleLineMoneyProps}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ action, title }: { action?: string; title: string }) {
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

function ActivityRow({ currencyCode, item, locale }: { currencyCode: string; item: SharedDashboardRecentActivityApi; locale: string }) {
  const isPaid = item.direction === "paid";

  return (
    <View className="min-h-16 flex-row items-center border-b border-surface-border py-2.5 last:border-b-0">
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={isPaid ? "account-arrow-up-outline" : "account-arrow-down-outline"} size={theme.icons.sm} color={isPaid ? theme.colors.state.success : theme.colors.accent.rose} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {item.category}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.participant} - {item.sharedTag}
        </Text>
      </View>
      <View className="items-end">
        <Text className={isPaid ? "font-sans text-sm font-semibold text-state-success" : "font-sans text-sm font-semibold text-accent-rose"}>
          {isPaid ? "+" : "-"}
          {currency(item.amount, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted">{formatIsoDateOnly(item.date, locale, { day: "numeric", month: "short" })}</Text>
      </View>
    </View>
  );
}

function ParticipantRow({ currencyCode, locale, participant }: { currencyCode: string; locale: string; participant: SharedDashboardParticipantApi }) {
  const balanceTone = participant.balance >= 0 ? "text-state-success" : "text-accent-rose";

  return (
    <View className="flex-row items-center gap-3 border-b border-surface-border py-3 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <Text className="font-sans text-sm font-bold text-brand-soft">{participant.avatarInitial}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {participant.name}
          {participant.isCurrentUser ? " (You)" : ""}
        </Text>
        <Text className="font-sans text-xs text-text-muted">
          Paid {currency(participant.paid, currencyCode, locale)} / Share {currency(participant.share, currencyCode, locale)}
        </Text>
      </View>
      <Text className={`font-sans text-sm font-semibold ${balanceTone}`} {...singleLineMoneyProps}>
        {currency(Math.abs(participant.balance), currencyCode, locale)}
      </Text>
    </View>
  );
}

function DonutChart({ categories, currencyCode, locale }: { categories: SharedDashboardSpendingCategoryApi[]; currencyCode: string; locale: string }) {
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
  const radius = 42;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.reduce<{ dash: number; item: SharedDashboardSpendingCategoryApi; offset: number }[]>((result, category) => {
    const previousDash = result.reduce((sum, segment) => sum + segment.dash, 0);
    return [
      ...result,
      {
        dash: (category.amount / total) * circumference,
        item: category,
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
        {segments.map((segment, index) => {
          return (
            <Circle
              key={segment.item.key}
              cx={56}
              cy={56}
              r={radius}
              stroke={chartColorAt(index)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={segment.offset}
              strokeLinecap="butt"
              rotation="-90"
              originX={56}
              originY={56}
            />
          );
        })}
      </Svg>
      <View className="absolute max-w-20 items-center">
        <Text className="font-sans text-sm font-bold text-text tabular-nums" {...singleLineMoneyProps}>
          {currency(total, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted">Total</Text>
      </View>
    </View>
  );
}

function SpendingChart({ categories, currencyCode, locale }: { categories: SharedDashboardSpendingCategoryApi[]; currencyCode: string; locale: string }) {
  if (categories.length === 0) {
    return <EmptyState icon="chart-donut" title="No shared spending" message="Shared category spending will appear here." />;
  }

  return (
    <View className={`${dashboardLayout.cardClassName} p-4`}>
      <View className="flex-row gap-4">
        <DonutChart categories={categories} currencyCode={currencyCode} locale={locale} />
        <View className="min-w-0 flex-1 justify-center gap-2.5">
          {categories.slice(0, 6).map((item, index) => (
            <View key={item.key} className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${legendDotClassAt(index)}`} />
              <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
                {item.category}
              </Text>
              <Text className="w-9 text-right font-sans text-xs text-text">{item.percentage}%</Text>
              <Text className="w-20 text-right font-sans text-xs text-text-muted tabular-nums" {...singleLineMoneyProps}>
                {currency(item.amount, currencyCode, locale)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function SharedScreen() {
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const dashboardQuery = useSharedDashboardQuery(token, vaultId);
  const markSettlement = useMarkSharedSettlementMutation(token, vaultId);

  if (dashboardQuery.isLoading) {
    return <SharedDashboardLoading />;
  }

  if (dashboardQuery.isError) {
    return (
      <Screen>
        <ErrorView message="Couldn't load your shared dashboard. Check that the server is running and try again." onRetry={() => dashboardQuery.refetch()} />
      </Screen>
    );
  }

  const payload = dashboardQuery.data?.data;
  if (!payload) {
    return (
      <Screen>
        <EmptyState icon="account-group-outline" title="No shared dashboard" message="No shared dashboard data was returned." />
      </Screen>
    );
  }

  const dashboard = payload.data;
  const settlementItem = activeSettlementItem(dashboard.settlement.items);
  const canSettle = dashboard.quickActions.markSettledEnabled && settlementItem !== null;
  const markSettled = () => {
    if (!settlementItem) {
      return;
    }
    const fromAccountId = settlementItem.from_accounts[0]?.id;
    const toAccountId = settlementItem.to_accounts[0]?.id;
    if (!fromAccountId || !toAccountId) {
      return;
    }
    markSettlement.mutate({
      amount: settlementItem.amount,
      fromAccountId,
      fromVaultId: settlementItem.from_vault_id,
      settlementDate: todayIso(),
      sharedVaultId: settlementItem.shared_vault_id,
      toAccountId,
      toVaultId: settlementItem.to_vault_id
    });
  };

  return (
    <Screen contentClassName={dashboardLayout.bottomClearanceClassName} onRefresh={() => dashboardQuery.refetch()} refreshing={dashboardQuery.isFetching}>
      <Header title={payload.vault.name} subtitle={`${dashboard.cycle.displayName} shared dashboard`} />
      <SettlementCard
        canSettle={canSettle}
        currencyCode={currencyCode}
        isSettling={markSettlement.isPending}
        label={dashboard.settlement.label}
        locale={locale}
        onSettle={markSettled}
        paid={dashboard.settlement.currentUserPaid}
        percentage={dashboard.settlement.settlementPercentage}
        settlementAmount={dashboard.settlement.amount}
        share={dashboard.settlement.currentUserShare}
      />

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Household Snapshot" />
        <View className="gap-3">
          <View className="flex-row gap-3">
            <SnapshotCard icon="account-cash-outline" label="Shared Spend" value={currency(dashboard.householdSnapshot.householdSpendThisMonth, currencyCode, locale)} />
            <SnapshotCard icon="calendar-alert" label="Bills" value={`${dashboard.householdSnapshot.upcomingBillsCount}`} />
          </View>
          <View className="flex-row gap-3">
            <SnapshotCard icon="account-group-outline" label="Participants" value={`${dashboard.householdSnapshot.participantCount}`} />
            <SnapshotCard
              icon="chart-donut"
              label="Top Category"
              value={dashboard.householdSnapshot.topCategory ? `${dashboard.householdSnapshot.topCategoryPercentage}% ${dashboard.householdSnapshot.topCategory}` : "None"}
            />
          </View>
        </View>
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader action="View all" title="Recent Activity" />
        {dashboard.recentActivity.length === 0 ? (
          <EmptyState icon="history" title="No shared activity" message="Shared expenses for this cycle will appear here." />
        ) : (
          <View className={`${dashboardLayout.cardClassName} px-4`}>
            {dashboard.recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} currencyCode={currencyCode} locale={locale} />
            ))}
          </View>
        )}
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Participants" />
        {dashboard.participants.length === 0 ? (
          <EmptyState icon="account-group-outline" title="No participants" message="Connected shared-vault participants will appear here." />
        ) : (
          <View className={`${dashboardLayout.cardClassName} px-4`}>
            {dashboard.participants.map((participant) => (
              <ParticipantRow key={participant.vaultId} participant={participant} currencyCode={currencyCode} locale={locale} />
            ))}
          </View>
        )}
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Shared Spending" />
        <SpendingChart categories={dashboard.spendingChart} currencyCode={currencyCode} locale={locale} />
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Monthly Summary" />
        <View className="flex-row gap-3">
          <MiniMoney label="Monthly Spend" value={dashboard.monthlySummary.monthlySpend} currencyCode={currencyCode} locale={locale} />
          <MiniMoney label="Daily Avg" value={dashboard.monthlySummary.dailyAverage} currencyCode={currencyCode} locale={locale} />
          <MiniMoney label="Projection" value={dashboard.monthlySummary.projection} currencyCode={currencyCode} locale={locale} />
        </View>
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Quick Actions" />
        <View className="gap-3">
          <SecondaryButton disabled={!dashboard.quickActions.canSplit} onPress={() => router.push("/transaction/new" as never)}>
            Split Expense
          </SecondaryButton>
          <SecondaryButton disabled={!dashboard.quickActions.canAddBill}>
            Add Bill
          </SecondaryButton>
        </View>
      </View>
    </Screen>
  );
}
