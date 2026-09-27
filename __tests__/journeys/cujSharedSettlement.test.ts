import {
  buildSettlementPayload,
  hasOutstandingSettlement
} from "@/features/dashboard/settlement";
import { invalidateSharedDependents } from "@/features/shared/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { SharedSettlementItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import * as SecureStore from "expo-secure-store";

const settlementItem: SharedSettlementItemApi = {
  amount: 1250,
  counterparty_name: "Aman",
  counterparty_vault_id: 2,
  direction: "payable",
  from_accounts: [{ balance: 5000, id: 10, is_primary: true, name: "Everyday", type: "Checking" }],
  from_name: "You",
  from_vault_id: 1,
  label: "You Owe:",
  shared_vault_id: 9,
  shared_vault_name: "Home",
  to_accounts: [{ balance: 800, id: 20, is_primary: true, name: "Shared", type: "Savings" }],
  to_name: "Aman",
  to_vault_id: 2
};

describe("CUJ 4 — Shared expense settlement updates dashboard", () => {
  const secureStorage = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    secureStorage.clear();

    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => secureStorage.get(key) ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      secureStorage.set(key, value);
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
      secureStorage.delete(key);
    });
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);

    useAuthStore.getState().setAuthenticated("token", {
      id: "1",
      isAdmin: true,
      name: "Personal",
      vaultType: "Individual"
    });
  });

  afterEach(() => {
    useAuthStore.getState().setSignedOut();
  });

  it("marks an outstanding settlement complete and refreshes dependents", () => {
    expect(hasOutstandingSettlement({ amount: 1250, direction: "payable" })).toBe(true);

    const payload = buildSettlementPayload({
      amount: 1250,
      fromAccountId: 10,
      item: settlementItem,
      settlementDate: "2026-08-09",
      toAccountId: 20
    });
    expect(payload).toMatchObject({
      amount: 1250,
      fromAccountId: 10,
      sharedVaultId: 9,
      toAccountId: 20
    });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    invalidateSharedDependents("1", 9);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.settlements("1", 9) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.expenses("1", 9) });
    expect(hasOutstandingSettlement({ amount: 0, direction: "settled" })).toBe(false);
  });
});
