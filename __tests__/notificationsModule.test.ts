import {
  DEFAULT_REMINDER_TIME,
  NOTIFICATION_STORAGE_KEYS
} from "@/features/notifications/constants/notifications";
import { monthlyReviewReminder } from "@/features/notifications/services/monthlyReviewReminder";
import {
  formatReminderTime,
  monthlyReminderSubtitle,
  nextFireDate,
  nextIntervalFireDate,
  parseReminderTime,
  serializeReminderTime,
  sharedReminderSubtitle
} from "@/features/notifications/services/notificationScheduler";
import {
  createDefaultNotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings
} from "@/features/notifications/services/notificationStorage";
import { sharedSettlementReminder } from "@/features/notifications/services/sharedSettlementReminder";
import type { ReminderContext } from "@/features/notifications/types";
import * as SecureStore from "expo-secure-store";
import * as planningApi from "@/services/api/planning";
import * as sharedApi from "@/services/api/shared";

jest.mock("@/services/api/shared", () => ({
  getSharedSettlements: jest.fn()
}));

jest.mock("@/services/api/planning", () => ({
  getPlanning: jest.fn()
}));

function baseContext(overrides: Partial<ReminderContext> = {}): ReminderContext {
  const settings = createDefaultNotificationSettings();
  settings.enabled = true;
  settings.shared.enabled = true;
  settings.monthly.enabled = true;

  return {
    currencyCode: "INR",
    locale: "en-IN",
    now: new Date("2026-08-07T10:00:00"),
    settings,
    token: "token",
    vaultId: "1",
    ...overrides
  };
}

describe("notification scheduler helpers", () => {
  it("parses, formats, and serializes reminder times", () => {
    expect(parseReminderTime("19:00")).toEqual({ hour: 19, minute: 0 });
    expect(serializeReminderTime(new Date(2026, 0, 1, 19, 0))).toBe("19:00");
    expect(formatReminderTime("19:00", "en-US")).toMatch(/7:00/);
  });

  it("builds type-specific reminder summaries", () => {
    expect(sharedReminderSubtitle({ frequency: "every3Days", time: "19:00" }, "en-US")).toBe(
      "Every 3 Days • 7:00 PM"
    );
    expect(monthlyReminderSubtitle({ repeatPolicy: "daily", time: "19:00" }, "en-US")).toBe(
      "Daily until completed • 7:00 PM"
    );
  });

  it("schedules the next fire date after the selected time", () => {
    const now = new Date("2026-08-07T20:00:00");
    const fireAt = nextFireDate("19:00", now);
    expect(fireAt.getDate()).toBe(8);
    expect(fireAt.getHours()).toBe(19);
  });

  it("respects frequency intervals from lastFiredAt", () => {
    const lastFired = new Date(2026, 7, 7, 19, 0, 0);
    const fireAt = nextIntervalFireDate({
      intervalDays: 3,
      lastFiredAt: lastFired.toISOString(),
      now: new Date(2026, 7, 8, 10, 0, 0),
      time: "19:00"
    });

    expect(fireAt.getFullYear()).toBe(2026);
    expect(fireAt.getMonth()).toBe(7);
    expect(fireAt.getDate()).toBe(10);
    expect(fireAt.getHours()).toBe(19);
  });
});

describe("notification storage", () => {
  beforeEach(() => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
  });

  it("loads defaults when nothing is stored", async () => {
    await expect(loadNotificationSettings()).resolves.toEqual(createDefaultNotificationSettings());
  });

  it("defaults shared frequency and monthly repeat policy", () => {
    const settings = createDefaultNotificationSettings();
    expect(settings.shared.frequency).toBe("daily");
    expect(settings.shared.onlyOutstanding).toBe(true);
    expect(settings.monthly.repeatPolicy).toBe("daily");
  });

  it("persists notification settings keys", async () => {
    const settings = createDefaultNotificationSettings();
    settings.shared.enabled = true;
    settings.shared.time = "19:00";
    settings.shared.frequency = "weekly";
    settings.monthly.repeatPolicy = "every3Days";
    settings.muted = true;

    await saveNotificationSettings(settings);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(NOTIFICATION_STORAGE_KEYS.sharedEnabled, "true");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(NOTIFICATION_STORAGE_KEYS.sharedTime, DEFAULT_REMINDER_TIME);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(NOTIFICATION_STORAGE_KEYS.sharedFrequency, "weekly");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(NOTIFICATION_STORAGE_KEYS.monthlyRepeatPolicy, "every3Days");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(NOTIFICATION_STORAGE_KEYS.muted, "true");
  });

  it("migrates legacy monthly repeatUntilReviewed=false to never", async () => {
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => {
      if (key === "notifications.monthly.repeatUntilReviewed") {
        return "false";
      }

      return null;
    });

    const settings = await loadNotificationSettings();
    expect(settings.monthly.repeatPolicy).toBe("never");
  });
});

describe("shared settlement reminder strategy", () => {
  it("cancels when muted or disabled", async () => {
    const muted = baseContext();
    muted.settings.muted = true;
    await expect(sharedSettlementReminder.evaluate(muted)).resolves.toEqual({ action: "cancel" });
  });

  it("cancels when balance is settled", async () => {
    jest.mocked(sharedApi.getSharedSettlements).mockResolvedValueOnce({
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

    await expect(sharedSettlementReminder.evaluate(baseContext())).resolves.toEqual({ action: "cancel" });
  });

  it("schedules an owed notification when there is an outstanding balance", async () => {
    jest.mocked(sharedApi.getSharedSettlements).mockResolvedValueOnce({
      data: {
        amount: 1250,
        direction: "payable",
        items: [
          {
            amount: 1250,
            counterparty_name: "Aman",
            counterparty_vault_id: 2,
            direction: "payable",
            from_accounts: [],
            from_name: "You",
            from_vault_id: 1,
            label: "You owe Aman",
            shared_vault_id: 9,
            shared_vault_name: "Home",
            to_accounts: [],
            to_name: "Aman",
            to_vault_id: 2
          }
        ],
        label: "You owe",
        net: -1250,
        payable: 1250,
        receivable: 0
      }
    });

    const context = baseContext();
    context.settings.shared.frequency = "every3Days";

    const result = await sharedSettlementReminder.evaluate(context);
    expect(result.action).toBe("schedule");
    if (result.action === "schedule") {
      expect(result.content.body).toContain("You owe Aman");
      expect(result.content.data.reminderType).toBe("sharedSettlement");
    }
  });
});

describe("monthly review reminder strategy", () => {
  it("cancels when the cycle is already reviewed", async () => {
    jest.mocked(planningApi.getPlanning).mockResolvedValueOnce({
      cycle: {
        closedAt: "2026-08-01T00:00:00Z",
        displayMonth: "July",
        endDate: "2026-07-31",
        id: 1,
        isCompleted: true,
        startDate: "2026-07-01",
        startMonth: 7,
        startYear: 2026,
        status: "Completed",
        vaultId: 1
      }
    } as never);

    await expect(monthlyReviewReminder.evaluate(baseContext())).resolves.toEqual({ action: "cancel" });
  });

  it("schedules when the cycle is past due and not reviewed", async () => {
    jest.mocked(planningApi.getPlanning).mockResolvedValueOnce({
      cycle: {
        daysRemaining: 0,
        displayMonth: "July",
        endDate: "2026-07-31",
        id: 1,
        isCompleted: false,
        startDate: "2026-07-01",
        startMonth: 7,
        startYear: 2026,
        status: "Current",
        vaultId: 1
      }
    } as never);

    const result = await monthlyReviewReminder.evaluate(
      baseContext({
        now: new Date("2026-08-02T10:00:00")
      })
    );

    expect(result.action).toBe("schedule");
    if (result.action === "schedule") {
      expect(result.content.body).toContain("July Financial Cycle");
      expect(result.content.data.route).toContain("openReview=1");
    }
  });

  it("cancels follow-up reminders when repeat policy is never and already fired", async () => {
    jest.mocked(planningApi.getPlanning).mockResolvedValueOnce({
      cycle: {
        daysRemaining: 0,
        displayMonth: "July",
        endDate: "2026-07-31",
        id: 1,
        isCompleted: false,
        startDate: "2026-07-01",
        startMonth: 7,
        startYear: 2026,
        status: "Current",
        vaultId: 1
      }
    } as never);

    const context = baseContext({
      now: new Date("2026-08-02T10:00:00")
    });
    context.settings.monthly.repeatPolicy = "never";
    context.settings.monthly.lastFiredAt = "2026-07-31T19:00:00.000Z";

    await expect(monthlyReviewReminder.evaluate(context)).resolves.toEqual({ action: "cancel" });
  });
});
