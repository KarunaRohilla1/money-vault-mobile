import { DEEP_LINK_ROUTES, NOTIFICATION_IDS } from "@/features/notifications/constants/notifications";
import { notificationEngine } from "@/features/notifications/services/notificationEngine";
import * as notificationService from "@/features/notifications/services/notification.service";
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  areOsNotificationsEnabled
} from "@/features/notifications/services/notificationPermissions";
import {
  createDefaultNotificationSettings,
  saveNotificationSettings
} from "@/features/notifications/services/notificationStorage";
import { Notifications } from "@/features/notifications/services/nativeNotifications";
import { queryClient } from "@/lib/queryClient";
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

describe("CUJ 5 & 6 — Notification scheduling, deep links, and cancellation", () => {
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
    jest.spyOn(notificationService, "navigateFromNotificationData").mockImplementation(() => undefined);
  });

  afterEach(() => {
    notificationEngine.dispose();
    useAuthStore.getState().setSignedOut();
  });

  it("schedules a shared settlement reminder and deep-links to the settlement screen on tap", async () => {
    const settings = createDefaultNotificationSettings();
    settings.enabled = true;
    settings.shared.enabled = true;
    settings.monthly.enabled = false;
    await saveNotificationSettings(settings);

    jest.mocked(sharedApi.getSharedSettlements).mockResolvedValue({
      data: {
        amount: 900,
        direction: "payable",
        items: [
          {
            amount: 900,
            counterparty_name: "Sam",
            counterparty_vault_id: 2,
            direction: "payable",
            from_accounts: [],
            from_name: "You",
            from_vault_id: 1,
            label: "You owe Sam",
            shared_vault_id: 9,
            shared_vault_name: "Home",
            to_accounts: [],
            to_name: "Sam",
            to_vault_id: 2
          }
        ],
        label: "You owe",
        net: -900,
        payable: 900,
        receivable: 0
      }
    });
    jest.mocked(planningApi.getPlanning).mockResolvedValue({
      cycle: {
        daysRemaining: 12,
        endDate: "2026-08-31",
        id: 1,
        isCompleted: false,
        startDate: "2026-08-01",
        status: "Current",
        vaultId: 1
      }
    } as never);

    await notificationEngine.initialize();

    expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          data: {
            reminderType: "sharedSettlement",
            route: DEEP_LINK_ROUTES.sharedSettlement
          }
        }),
        notificationId: NOTIFICATION_IDS.sharedSettlement
      })
    );

    expect(notificationService.resolveNotificationRoute({ reminderType: "sharedSettlement" })).toBe(
      DEEP_LINK_ROUTES.sharedSettlement
    );
    expect(notificationService.resolveNotificationRoute({ route: DEEP_LINK_ROUTES.sharedSettlement })).toBe(
      DEEP_LINK_ROUTES.sharedSettlement
    );

    notificationService.navigateFromNotificationData({
      reminderType: "sharedSettlement",
      route: DEEP_LINK_ROUTES.sharedSettlement
    });
    expect(notificationService.navigateFromNotificationData).toHaveBeenCalled();
  });

  it("schedules a monthly review reminder, deep-links to Planning, then cancels after review completes", async () => {
    const settings = createDefaultNotificationSettings();
    settings.enabled = true;
    settings.shared.enabled = false;
    settings.monthly.enabled = true;
    await saveNotificationSettings(settings);

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
    jest.mocked(planningApi.getPlanning).mockResolvedValueOnce({
      cycle: {
        daysRemaining: 0,
        displayMonth: "July",
        endDate: "2026-07-31",
        id: 1,
        isCompleted: false,
        startDate: "2026-07-01",
        status: "Current",
        vaultId: 1
      }
    } as never);

    await notificationEngine.initialize();

    expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          data: {
            reminderType: "monthlyReview",
            route: DEEP_LINK_ROUTES.monthlyReview
          }
        }),
        notificationId: NOTIFICATION_IDS.monthlyReview
      })
    );
    expect(notificationService.resolveNotificationRoute({ reminderType: "monthlyReview" })).toBe(DEEP_LINK_ROUTES.monthlyReview);

    // Complete review → cycle closed → reminder cancelled.
    jest.mocked(planningApi.getPlanning).mockResolvedValue({
      cycle: {
        closedAt: "2026-08-01T12:00:00Z",
        daysRemaining: 0,
        displayMonth: "July",
        endDate: "2026-07-31",
        id: 1,
        isCompleted: true,
        startDate: "2026-07-01",
        status: "Completed",
        vaultId: 1
      }
    } as never);

    await notificationEngine.reevaluate();
    expect(notificationService.cancelScheduledNotification).toHaveBeenCalledWith(NOTIFICATION_IDS.monthlyReview);
  });

  it("treats denied notification permission as disabled OS notifications", async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      canAskAgain: false,
      granted: false,
      status: "denied"
    } as never);
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
      canAskAgain: false,
      granted: false,
      status: "denied"
    } as never);

    const status = await getNotificationPermissionStatus();
    expect(status).toBe("denied");
    expect(areOsNotificationsEnabled(status)).toBe(false);
    await expect(requestNotificationPermissions()).resolves.toBe("denied");
  });
});
