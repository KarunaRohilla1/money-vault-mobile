import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet, ErrorView, LoadingSkeleton, PrimaryButton } from "@/components/ui";
import { EmptySettlementState, SettlementEndOfList } from "@/features/settlements/components/EmptySettlementState";
import { SettlementDetailsSheet } from "@/features/settlements/components/SettlementDetailsSheet";
import { SettlementFilterTabs } from "@/features/settlements/components/SettlementFilterTabs";
import { SettlementHistoryCard } from "@/features/settlements/components/SettlementHistoryCard";
import { useSettlementHistory } from "@/features/settlements/hooks/useSettlementHistory";
import { SETTLEMENT_DIRECTION_FILTERS } from "@/features/settlements/settlementModel";
import type { SettlementDetailsViewModel, SettlementDirectionFilter, SettlementListItem } from "@/features/settlements/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type TimelineRow =
  | { key: string; kind: "month"; label: string }
  | { key: string; kind: "item"; item: SettlementListItem }
  | { key: string; kind: "end" };

function HistorySkeleton() {
  return (
    <View className="gap-3 px-5 pt-4">
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </View>
  );
}

export function SettlementHistoryScreen() {
  const router = useRouter();
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const sharedVaultId = vault?.vaultType === "Shared" && vaultId ? Number(vaultId) : null;
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const history = useSettlementHistory({ sharedVaultId });
  const [details, setDetails] = useState<SettlementDetailsViewModel | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const rows = useMemo<TimelineRow[]>(() => {
    if (history.history.length === 0) {
      return [];
    }

    const next: TimelineRow[] = [];
    for (const group of history.groups) {
      next.push({ key: `month-${group.key}`, kind: "month", label: group.label });
      for (const item of group.items) {
        next.push({ key: `item-${item.id}`, kind: "item", item });
      }
    }

    if (!history.hasMore) {
      next.push({ key: "end", kind: "end" });
    }

    return next;
  }, [history.groups, history.hasMore, history.history.length]);

  function openDetails(item: SettlementListItem) {
    setDetails(history.detailsFor(item));
    setDetailsVisible(true);
  }

  function applyDirection(direction: SettlementDirectionFilter) {
    history.setDirection(direction);
    setFilterVisible(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-lg bg-surface"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <Text accessibilityRole="header" className="font-sans text-lg font-bold text-text">
          Settlement History
        </Text>
        <Pressable
          accessibilityLabel="Filter settlements"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-lg bg-surface"
          onPress={() => setFilterVisible(true)}
        >
          <MaterialCommunityIcons name="filter-variant" size={theme.icons.md} color={theme.colors.brand.soft} />
        </Pressable>
      </View>

      <View className="px-5">
        <SettlementFilterTabs onChange={history.setDirection} value={history.filters.direction} />
      </View>

      {history.loading ? (
        <HistorySkeleton />
      ) : history.error ? (
        <View className="px-5 pt-6">
          <ErrorView message="Couldn't load settlement history. Check your connection and try again." onRetry={history.refresh} />
        </View>
      ) : rows.length === 0 ? (
        <View className="px-5 pt-6">
          <EmptySettlementState />
        </View>
      ) : (
        <FlatList
          contentContainerClassName="gap-3 px-5 pb-10 pt-4"
          data={rows}
          keyExtractor={(item) => item.key}
          ListFooterComponent={
            history.isFetchingMore ? (
              <View className="items-center py-4">
                <ActivityIndicator color={theme.colors.brand.soft} />
              </View>
            ) : null
          }
          onEndReached={() => history.loadMore()}
          onEndReachedThreshold={0.4}
          onRefresh={history.refresh}
          refreshing={history.isRefreshing}
          renderItem={({ item }) => {
            if (item.kind === "month") {
              return (
                <Text accessibilityRole="header" className="pt-2 font-sans text-xs font-bold uppercase tracking-wide text-text-muted">
                  {item.label}
                </Text>
              );
            }

            if (item.kind === "end") {
              return <SettlementEndOfList />;
            }

            return (
              <SettlementHistoryCard
                currencyCode={currencyCode}
                item={item.item}
                locale={locale}
                onPress={openDetails}
                variant="detailed"
              />
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SettlementDetailsSheet
        currencyCode={currencyCode}
        details={details}
        locale={locale}
        onClose={() => setDetailsVisible(false)}
        visible={detailsVisible}
      />

      <BottomSheet visible={filterVisible} title="Filter" onClose={() => setFilterVisible(false)}>
        <View className="gap-3">
          {SETTLEMENT_DIRECTION_FILTERS.map((filter) => {
            const active = filter.id === history.filters.direction;

            return (
              <Pressable
                key={filter.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={
                  active
                    ? "min-h-12 justify-center rounded-lg border border-brand bg-brand-deep px-4"
                    : "min-h-12 justify-center rounded-lg border border-surface-border bg-surface px-4"
                }
                onPress={() => applyDirection(filter.id)}
              >
                <Text className="font-sans text-sm font-semibold text-text">{filter.label}</Text>
              </Pressable>
            );
          })}
          <PrimaryButton onPress={() => setFilterVisible(false)}>Done</PrimaryButton>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
