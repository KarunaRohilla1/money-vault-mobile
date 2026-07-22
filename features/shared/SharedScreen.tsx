import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
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
    <View className="flex-row items-center justify-between gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-full border border-surface-border bg-background-muted">
        <MaterialCommunityIcons name="menu" size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
      </View>
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <MaterialCommunityIcons name="account-group" size={theme.icons.lg} color={theme.colors.brand.soft} />
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-2xl font-bold text-text" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <PrimaryButton className="h-11 rounded-xl border border-brand-muted bg-surface px-4" icon="plus-circle-outline" onPress={() => router.push("/transaction/new" as never)}>
        Add Expense
      </PrimaryButton>
    </View>
  );
}

function SettlementCard({
  canSettle,
  currencyCode,
  isSettling,
  direction,
  locale,
  onSettle,
  paid,
  percentage,
  settlementAmount,
  share
}: {
  canSettle: boolean;
  currencyCode: string;
  direction: "payable" | "receivable" | "settled";
  isSettling: boolean;
  locale: string;
  onSettle: () => void;
  paid: number;
  percentage: number;
  settlementAmount: number;
  share: number;
}) {
  const progress = Math.min(100, Math.max(0, percentage));
  const statusLabel = direction === "payable" ? "You owe" : direction === "receivable" ? "You are owed" : "All settled";

  return (
    <View className={`${dashboardLayout.elevatedCardClassName} gap-5 p-5`}>
      <View className="flex-row items-stretch gap-5">
        <View className="flex-1 gap-3">
          <Text className={dashboardTypography.cardTitle}>Shared Balance</Text>
          <View>
            <Text className="font-sans text-sm text-brand-soft">{statusLabel}</Text>
            <CurrencyText value={settlementAmount} currencyCode={currencyCode} locale={locale} className="text-5xl font-bold" />
          </View>
          <SecondaryButton className="h-11 rounded-xl border-brand bg-brand-deep" disabled={!canSettle || isSettling} icon="check-circle-outline" onPress={onSettle}>
            Mark Settled
          </SecondaryButton>
        </View>
        <View className="w-px bg-surface-border" />
        <View className="flex-1 justify-center gap-5">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="font-sans text-xs text-text-muted">{"Total you've paid"}</Text>
              <CurrencyText value={paid} currencyCode={currencyCode} locale={locale} className="mt-2 text-xl font-semibold" />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-xs text-text-muted">Total share</Text>
              <CurrencyText value={share} currencyCode={currencyCode} locale={locale} className="mt-2 text-xl font-semibold" />
            </View>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-brand-deep">
            <View className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </View>
          <Text className="font-sans text-sm text-text-muted">{"You've paid"} {Math.round(progress)}% of the total share</Text>
        </View>
      </View>
    </View>
  );
}

function SnapshotCard({
  accent,
  caption,
  icon,
  label,
  value
}: {
  accent: "brand" | "blue" | "green" | "orange";
  caption: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
}) {
  const tone = {
    blue: { bg: "bg-state-info/20", color: theme.colors.state.info, text: "text-state-info" },
    brand: { bg: "bg-brand-deep", color: theme.colors.brand.soft, text: "text-brand-soft" },
    green: { bg: "bg-accent-emerald/20", color: theme.colors.accent.emerald, text: "text-state-success" },
    orange: { bg: "bg-state-warning/20", color: theme.colors.state.warning, text: "text-state-warning" }
  }[accent];

  return (
    <View className="min-h-32 flex-1 justify-between rounded-xl border border-surface-border bg-surface p-4">
      <View className={`h-9 w-9 items-center justify-center rounded-lg ${tone.bg}`}>
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={tone.color} />
      </View>
      <View className="gap-2">
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans text-2xl font-semibold text-text" {...singleLineMoneyProps}>
          {value}
        </Text>
        <Text className={`font-sans text-xs font-semibold ${tone.text}`} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ action, onAction, title }: { action?: string; onAction?: () => void; title: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={dashboardTypography.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" className="flex-row items-center gap-1" onPress={onAction}>
          <Text className="font-sans text-sm font-semibold text-brand-soft">{action}</Text>
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.brand.soft} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ActivityRow({ currencyCode, item, locale }: { currencyCode: string; item: SharedDashboardRecentActivityApi; locale: string }) {
  const isPaid = item.direction === "paid";

  return (
    <View className="min-h-16 flex-row items-center border-b border-surface-border py-2.5 last:border-b-0">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={isPaid ? "account-arrow-up-outline" : "account-arrow-down-outline"} size={theme.icons.sm} color={isPaid ? theme.colors.state.success : theme.colors.accent.rose} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {item.participant} paid
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.category}
        </Text>
      </View>
      <View className="mx-3 rounded-lg bg-brand-deep px-3 py-1">
        <Text className="font-sans text-xs font-semibold text-brand-soft">{item.sharedTag}</Text>
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
        <View className="mt-2 flex-row gap-5">
          <MetricColumn label="Paid" value={currency(participant.paid, currencyCode, locale)} />
          <MetricColumn label="Share" value={currency(participant.share, currencyCode, locale)} />
        </View>
      </View>
      <View className="items-end">
        <Text className="font-sans text-xs text-text-muted">Balance</Text>
        <Text className={`font-sans text-sm font-semibold ${balanceTone}`} {...singleLineMoneyProps}>
          {participant.balance < 0 ? "-" : "+"}
          {currency(Math.abs(participant.balance), currencyCode, locale)}
        </Text>
      </View>
    </View>
  );
}

function MetricColumn({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <Text className="font-sans text-xs font-semibold text-text">{value}</Text>
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
    <View className={`${dashboardLayout.cardClassName} flex-1 p-4`}>
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

function QuickAction({
  disabled,
  icon,
  label,
  onPress,
  subtitle,
  tone
}: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress?: () => void;
  subtitle: string;
  tone: "brand" | "cyan" | "orange";
}) {
  const toneMap = {
    brand: { bg: "bg-brand-deep", border: "border-brand-muted", color: theme.colors.brand.soft },
    cyan: { bg: "bg-state-info/20", border: "border-state-info/40", color: theme.colors.accent.cyan },
    orange: { bg: "bg-state-warning/20", border: "border-state-warning/40", color: theme.colors.state.warning }
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-20 flex-1 flex-row items-center gap-3 rounded-xl border ${toneMap.border} ${toneMap.bg} p-4 ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand">
        <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.text.inverse} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export function SharedScreen() {
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const { width } = useWindowDimensions();
  const dashboardQuery = useSharedDashboardQuery(token, vaultId);
  const markSettlement = useMarkSharedSettlementMutation(token, vaultId);
  const useSideBySideCards = width >= 700;

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
      <Header title="Shared Vault" subtitle="Household finances at a glance" />
      <SettlementCard
        canSettle={canSettle}
        currencyCode={currencyCode}
        direction={dashboard.settlement.direction}
        isSettling={markSettlement.isPending}
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
            <SnapshotCard
              accent="brand"
              caption="This Month"
              icon="briefcase-outline"
              label="Shared Spend"
              value={currency(dashboard.householdSnapshot.householdSpendThisMonth, currencyCode, locale)}
            />
            <SnapshotCard
              accent="orange"
              caption={`${dashboard.householdSnapshot.upcomingBillsCount} bills due soon`}
              icon="calendar-month-outline"
              label="Upcoming Bills"
              value={currency(0, currencyCode, locale)}
            />
          </View>
          <View className="flex-row gap-3">
            <SnapshotCard
              accent="green"
              caption={dashboard.householdSnapshot.participantCount > 1 ? "You + others" : "Only you"}
              icon="account-group"
              label="Participants"
              value={`${dashboard.householdSnapshot.participantCount}`}
            />
            <SnapshotCard
              accent="blue"
              icon="chart-donut"
              label="Top Category"
              caption={
                dashboard.householdSnapshot.topCategory
                  ? `${dashboard.householdSnapshot.topCategoryPercentage}% - ${currency(dashboard.householdSnapshot.topCategoryAmount, currencyCode, locale)}`
                  : "No spend"
              }
              value={dashboard.householdSnapshot.topCategory ? `${dashboard.householdSnapshot.topCategoryPercentage}% ${dashboard.householdSnapshot.topCategory}` : "None"}
            />
          </View>
        </View>
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader action="View all" title="Recent Shared Activity" />
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

      <View className={useSideBySideCards ? "flex-row gap-3" : "gap-5"}>
        <View className={`${dashboardLayout.sectionGapClassName} ${useSideBySideCards ? "flex-1" : ""}`}>
          <SectionHeader action="View Details" title="Participants" />
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

        <View className={`${dashboardLayout.sectionGapClassName} ${useSideBySideCards ? "flex-1" : ""}`}>
          <SectionHeader action="View Analytics" title="Shared Spending" />
          <SpendingChart categories={dashboard.spendingChart} currencyCode={currencyCode} locale={locale} />
        </View>
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="This Month" />
        <View className={`${dashboardLayout.cardClassName} flex-row gap-3 p-4`}>
          <View className="flex-1">
            <Text className="font-sans text-xs text-text-muted">Total Household Spend</Text>
            <CurrencyText value={dashboard.monthlySummary.monthlySpend} currencyCode={currencyCode} locale={locale} className="mt-1 text-2xl font-bold" />
          </View>
          <View className="w-px bg-surface-border" />
          <View className="flex-1">
            <Text className="font-sans text-xs text-text-muted">Daily Average</Text>
            <CurrencyText value={dashboard.monthlySummary.dailyAverage} currencyCode={currencyCode} locale={locale} className="mt-1 text-2xl font-bold" />
          </View>
          <View className="w-px bg-surface-border" />
          <View className="flex-1">
            <Text className="font-sans text-xs text-text-muted">Projected</Text>
            <CurrencyText value={dashboard.monthlySummary.projection} currencyCode={currencyCode} locale={locale} className="mt-1 text-2xl font-bold text-brand-soft" />
          </View>
        </View>
      </View>

      <View className={dashboardLayout.sectionGapClassName}>
        <SectionHeader title="Quick Actions" />
        <View className={useSideBySideCards ? "flex-row gap-3" : "gap-3"}>
          <QuickAction
            disabled={!dashboard.quickActions.canAddExpense}
            icon="plus-circle-outline"
            label="Add Shared Expense"
            onPress={() => router.push("/transaction/new" as never)}
            subtitle="Record a new expense"
            tone="brand"
          />
          <QuickAction
            disabled={!dashboard.quickActions.canSplit}
            icon="vector-combine"
            label="Split Equally"
            onPress={() => router.push("/transaction/new" as never)}
            subtitle="Create equal split"
            tone="cyan"
          />
          <QuickAction disabled={!dashboard.quickActions.canAddBill} icon="calendar-month-outline" label="Add Bill" subtitle="Create a shared bill" tone="orange" />
        </View>
      </View>
    </Screen>
  );
}
