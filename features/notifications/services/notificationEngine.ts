import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  cancelScheduledNotification,
  getLastNotificationResponseData,
  navigateFromNotificationData,
  scheduleLocalNotification
} from "@/features/notifications/services/notification.service";
import {
  areOsNotificationsEnabled,
  ensureAndroidReminderChannel,
  getNotificationPermissionStatus
} from "@/features/notifications/services/notificationPermissions";
import { monthlyReviewReminder } from "@/features/notifications/services/monthlyReviewReminder";
import { reminderTypeFromData } from "@/features/notifications/services/notificationScheduler";
import {
  createDefaultNotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings
} from "@/features/notifications/services/notificationStorage";
import { sharedSettlementReminder } from "@/features/notifications/services/sharedSettlementReminder";
import type { NotificationSettings, ReminderContext, ReminderStrategy } from "@/features/notifications/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

type EngineListener = (settings: NotificationSettings) => void;

class NotificationEngine {
  private initialized = false;
  private listeners = new Set<EngineListener>();
  private receivedSubscription: { remove: () => void } | null = null;
  private responseSubscription: { remove: () => void } | null = null;
  private settings: NotificationSettings = createDefaultNotificationSettings();
  private strategies: ReminderStrategy[] = [sharedSettlementReminder, monthlyReviewReminder];
  private evaluating: Promise<void> | null = null;

  public registerStrategy(strategy: ReminderStrategy) {
    this.strategies = [...this.strategies.filter((entry) => entry.type !== strategy.type), strategy];
  }

  public getSettings() {
    return this.settings;
  }

  public subscribe(listener: EngineListener) {
    this.listeners.add(listener);
    listener(this.settings);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public async initialize() {
    if (this.initialized) {
      await this.reevaluate();
      return;
    }

    await ensureAndroidReminderChannel();
    this.settings = await loadNotificationSettings();

    const permission = await getNotificationPermissionStatus();
    const enabled = areOsNotificationsEnabled(permission);

    if (this.settings.enabled !== enabled) {
      this.settings = { ...this.settings, enabled };
      await saveNotificationSettings(this.settings);
    }

    this.receivedSubscription = addNotificationReceivedListener((data) => {
      void this.recordReminderDelivery(data);
    });

    this.responseSubscription = addNotificationResponseListener((data) => {
      void this.recordReminderDelivery(data);
      navigateFromNotificationData(data);
    });

    const coldStartData = await getLastNotificationResponseData();
    if (coldStartData) {
      setTimeout(() => {
        navigateFromNotificationData(coldStartData);
      }, 400);
    }

    this.initialized = true;
    this.emit();
    await this.reevaluate();
  }

  public async updateSettings(next: NotificationSettings) {
    this.settings = next;
    await saveNotificationSettings(next);
    this.emit();
    await this.reevaluate();
  }

  public async reevaluate() {
    if (this.evaluating) {
      await this.evaluating;
      return;
    }

    this.evaluating = this.runEvaluation().finally(() => {
      this.evaluating = null;
    });

    await this.evaluating;
  }

  public dispose() {
    this.receivedSubscription?.remove();
    this.receivedSubscription = null;
    this.responseSubscription?.remove();
    this.responseSubscription = null;
    this.initialized = false;
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }

  private buildContext(): ReminderContext {
    const auth = useAuthStore.getState();
    const settingsStore = useSettingsStore.getState();

    return {
      currencyCode: settingsStore.currencyCode,
      locale: settingsStore.locale,
      now: new Date(),
      settings: this.settings,
      token: auth.token,
      vaultId: auth.vault?.id ?? null
    };
  }

  private async recordReminderDelivery(data: Record<string, unknown> | undefined) {
    const reminderType = reminderTypeFromData(data);
    if (!reminderType) {
      return;
    }

    const firedAt = new Date().toISOString();
    const next: NotificationSettings =
      reminderType === "sharedSettlement"
        ? {
            ...this.settings,
            shared: { ...this.settings.shared, lastFiredAt: firedAt }
          }
        : {
            ...this.settings,
            monthly: { ...this.settings.monthly, lastFiredAt: firedAt }
          };

    this.settings = next;
    await saveNotificationSettings(next);
    this.emit();
    await this.reevaluate();
  }

  private async runEvaluation() {
    const context = this.buildContext();

    await Promise.all(
      this.strategies.map(async (strategy) => {
        const decision = await strategy.evaluate(context);

        if (decision.action === "cancel") {
          await cancelScheduledNotification(strategy.id).catch(() => undefined);
          return;
        }

        await scheduleLocalNotification({
          content: decision.content,
          fireAt: decision.fireAt,
          notificationId: strategy.id
        });
      })
    );
  }
}

export const notificationEngine = new NotificationEngine();

export function notifyNotificationDomainChanged() {
  void notificationEngine.reevaluate();
}
