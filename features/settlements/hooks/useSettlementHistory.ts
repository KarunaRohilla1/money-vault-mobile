import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  SETTLEMENT_PAGE_SIZE,
  settlementHistoryFiltersKey
} from "@/features/settlements/settlementModel";
import { settlementService } from "@/features/settlements/services/settlement.service";
import type {
  SettlementDetailsViewModel,
  SettlementDirectionFilter,
  SettlementHistoryFilters,
  SettlementHistoryPageApi,
  SettlementListItem,
  SettlementMonthGroup
} from "@/features/settlements/types";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export interface UseSettlementHistoryResult {
  detailsFor: (item: SettlementListItem) => SettlementDetailsViewModel;
  error: boolean;
  filters: SettlementHistoryFilters;
  groups: SettlementMonthGroup[];
  hasMore: boolean;
  history: SettlementListItem[];
  isFetchingMore: boolean;
  isRefreshing: boolean;
  loadMore: () => void;
  loading: boolean;
  preview: SettlementListItem[];
  refresh: () => void;
  setDirection: (direction: SettlementDirectionFilter) => void;
}

export function useSettlementHistory(options?: {
  enabled?: boolean;
  previewLimit?: number;
  sharedVaultId?: number | null;
}): UseSettlementHistoryResult {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const locale = useSettingsStore((state) => state.locale);
  const sharedVaultId = options?.sharedVaultId ?? (vaultId ? Number(vaultId) : null);
  const enabled = options?.enabled ?? true;
  const [filters, setFilters] = useState<SettlementHistoryFilters>(() => settlementService.defaultFilters());

  const query = useInfiniteQuery({
    enabled: Boolean(enabled && token && vaultId),
    getNextPageParam: (lastPage: SettlementHistoryPageApi) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<SettlementHistoryPageApi> => {
      if (typeof sharedVaultId === "number") {
        return settlementService.getHistory({
          direction: filters.direction,
          limit: SETTLEMENT_PAGE_SIZE,
          offset: pageParam,
          sharedVaultId,
          token: token ?? ""
        });
      }

      return settlementService.getHistory({
        direction: filters.direction,
        limit: SETTLEMENT_PAGE_SIZE,
        offset: pageParam,
        token: token ?? ""
      });
    },
    queryKey: queryKeys.shared.settlementHistory(vaultId, sharedVaultId, settlementHistoryFiltersKey(filters))
  });

  const history = useMemo(() => {
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    return settlementService.toListItems(items, locale);
  }, [locale, query.data?.pages]);

  const groups = useMemo(() => settlementService.toMonthGroups(history), [history]);
  const preview = useMemo(
    () => settlementService.preview(history, options?.previewLimit),
    [history, options?.previewLimit]
  );
  const hasMore = Boolean(query.hasNextPage);

  return {
    detailsFor: (item) => settlementService.toDetails(item),
    error: query.isError,
    filters,
    groups,
    hasMore,
    history,
    isFetchingMore: query.isFetchingNextPage,
    isRefreshing: query.isRefetching,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
    loading: query.isLoading,
    preview,
    refresh: () => {
      void query.refetch();
    },
    setDirection: (direction) => {
      setFilters((current) => ({ ...current, direction }));
    }
  };
}
