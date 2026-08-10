import {
  buildCreateSettlementPayload,
  calculateOutstandingAfter,
  calculateSettlementStatus,
  emptySettlementHistoryFilters,
  filterSettlementsByDirection,
  groupSettlementsByMonth,
  mapSettlementApiToEntity,
  mapSettlementToDetails,
  mapSettlementToListItem,
  normalizeSettlementHistoryPage,
  SETTLEMENT_PAGE_SIZE,
  settlementHistoryPreview,
  sortSettlementsNewestFirst
} from "@/features/settlements/settlementModel";
import type {
  CreateSettlementInput,
  Settlement,
  SettlementApi,
  SettlementDetailsViewModel,
  SettlementDirectionFilter,
  SettlementHistoryFilters,
  SettlementHistoryPageApi,
  SettlementListItem,
  SettlementMonthGroup
} from "@/features/settlements/types";
import { apiClient } from "@/services/api/client";

export interface SettlementHistoryQuery {
  direction?: SettlementDirectionFilter;
  limit?: number;
  offset?: number;
  sharedVaultId?: number;
  token: string;
}

/**
 * Settlement domain service.
 * Keeps settlement business rules outside UI components.
 */
export const settlementService = {
  async createSettlement(token: string, input: CreateSettlementInput) {
    const payload = buildCreateSettlementPayload(input);
    await apiClient.markSharedSettlement(token, payload);
  },

  async getHistory(query: SettlementHistoryQuery): Promise<SettlementHistoryPageApi> {
    const params: {
      direction?: string;
      limit?: number;
      offset?: number;
      sharedVaultId?: number;
    } = {
      direction: query.direction ?? "all",
      limit: query.limit ?? SETTLEMENT_PAGE_SIZE,
      offset: query.offset ?? 0
    };

    if (typeof query.sharedVaultId === "number") {
      params.sharedVaultId = query.sharedVaultId;
    }

    const response = await apiClient.getSharedSettlementHistory(query.token, params);
    return normalizeSettlementHistoryPage(response.data);
  },

  filter(items: SettlementApi[], direction: SettlementDirectionFilter) {
    return filterSettlementsByDirection(items, direction);
  },

  sort(items: SettlementApi[]) {
    return sortSettlementsNewestFirst(items);
  },

  calculateOutstandingBefore(outstandingBefore: number) {
    return Math.round(outstandingBefore * 100) / 100;
  },

  calculateOutstandingAfter(outstandingBefore: number, amount: number) {
    return calculateOutstandingAfter(outstandingBefore, amount);
  },

  calculateStatus(outstandingBefore: number, amount: number) {
    return calculateSettlementStatus(outstandingBefore, amount);
  },

  toEntities(items: SettlementApi[]): Settlement[] {
    return items.map(mapSettlementApiToEntity);
  },

  toListItems(items: SettlementApi[], locale: string): SettlementListItem[] {
    return this.sort(items).map((item) => mapSettlementToListItem(item, locale));
  },

  toMonthGroups(items: SettlementListItem[]): SettlementMonthGroup[] {
    return groupSettlementsByMonth(items);
  },

  toDetails(item: SettlementListItem): SettlementDetailsViewModel {
    return mapSettlementToDetails(item);
  },

  preview(items: SettlementListItem[], limit?: number) {
    return settlementHistoryPreview(items, limit);
  },

  defaultFilters(): SettlementHistoryFilters {
    return emptySettlementHistoryFilters();
  }
};
