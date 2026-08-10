import {
  buildSettlementPayload,
  hasOutstandingSettlement
} from "@/features/dashboard/settlement";
import { NOTIFICATION_IDS } from "@/features/notifications/constants/notifications";
import { notificationEngine } from "@/features/notifications/services/notificationEngine";
import * as notificationService from "@/features/notifications/services/notification.service";
import {
  createDefaultNotificationSettings,
  saveNotificationSettings
} from "@/features/notifications/services/notificationStorage";
import { invalidateSharedDependents } from "@/features/shared/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { SharedSettlementItemApi } from "@/services/api/types";
import * as planningApi from "@/services/api/planning";
import * as sharedApi from "@/services/api/shared";
import { useAuthStore } from "@/stores/authStore";
import * as SecureStore from "expo-secure-store";

jest.mock("@/services/api/shared", () => ({
  getSharedSettlements: jest.fn()
}));

jest.mock("@/services/api/planning", () => ({
  getPlanning: jest.fn()
}));

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

describe("CUJ 4 — Shared expense settlement updates dashboard and notifications", () => {
  const secureStorage = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    secureStorage.clear();
    notificationEngine.dispose();

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

    jest.spyOn(notificationService, "scheduleLocalNotification").mockResolvedValue(undefined);
    jest.spyOn(notificationService, "cancelScheduledNotification").mockResolvedValue(undefined);
    jest.spyOn(notificationService, "addNotificationReceivedListener").mockReturnValue({ remove: jest.fn() });
    jest.spyOn(notificationService, "addNotificationResponseListener").mockReturnValue({ remove: jest.fn() });
    jest.spyOn(notificationService, "getLastNotificationResponseData").mockResolvedValue(undefined);

    jest.mocked(planningApi.getPlanning).mockResolvedValue({
      cycle: {
        daysRemaining: 10,
        endDate: "2026-08-31",
        id: 1,
        isCompleted: false,
        startDate: "2026-08-01",
        status: "Current",
        vaultId: 1
      }
    } as never);
  });

  afterEach(() => {
    notificationEngine.dispose();
    useAuthStore.getState().setSignedOut();
  });

  it("marks an outstanding settlement complete, refreshes dependents, and cancels the shared reminder", async () => {
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

    const settings = createDefaultNotificationSettings();
    settings.enabled = true;
    settings.shared.enabled = true;
    settings.monthly.enabled = false;
    await saveNotificationSettings(settings);

    jest.mocked(sharedApi.getSharedSettlements).mockResolvedValueOnce({
      data: {
        amount: 1250,
        direction: "payable",
        items: [settlementItem],
        label: "You owe",
        net: -1250,
        payable: 1250,
        receivable: 0
      }
    });

    await notificationEngine.initialize();
    expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: NOTIFICATION_IDS.sharedSettlement
      })
    );

    // Settlement becomes zero after mark-complete → invalidate dashboard/shared and reevaluate reminders.
    jest.mocked(sharedApi.getSharedSettlements).mockResolvedValue({
      data: {
        amount: 0,
        direction: "settled",
        items: [],
        label: "Settled",
        net: 0,
        payable: 0,
        receivable: 0
      }
    });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    invalidateSharedDependents("1", 9);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.settlements("1", 9) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.expenses("1", 9) });
    expect(hasOutstandingSettlement({ amount: 0, direction: "settled" })).toBe(false);

    await notificationEngine.reevaluate();
    expect(notificationService.cancelScheduledNotification).toHaveBeenCalledWith(NOTIFICATION_IDS.sharedSettlement);
  });
});
