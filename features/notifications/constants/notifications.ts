export const NOTIFICATION_STORAGE_KEYS = {
  enabled: "notifications.enabled",
  muted: "notifications.muted",
  monthlyEnabled: "notifications.monthly.enabled",
  monthlyLastFiredAt: "notifications.monthly.lastFiredAt",
  monthlyRepeatPolicy: "notifications.monthly.repeatPolicy",
  monthlyTime: "notifications.monthly.time",
  sharedEnabled: "notifications.shared.enabled",
  sharedFrequency: "notifications.shared.frequency",
  sharedLastFiredAt: "notifications.shared.lastFiredAt",
  sharedOnlyOutstanding: "notifications.shared.onlyOutstanding",
  sharedTime: "notifications.shared.time"
} as const;

export const NOTIFICATION_IDS = {
  monthlyReview: "money-vault.monthly-review",
  sharedSettlement: "money-vault.shared-settlement"
} as const;

export const NOTIFICATION_CHANNELS = {
  reminders: "money-vault-reminders"
} as const;

export const DEFAULT_REMINDER_TIME = "19:00";

export type SharedReminderFrequency = "daily" | "every3Days" | "weekly";
export type MonthlyRepeatPolicy = "daily" | "every3Days" | "never";

export const SHARED_FREQUENCY_OPTIONS: readonly { label: string; value: SharedReminderFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Every 3 Days", value: "every3Days" },
  { label: "Weekly", value: "weekly" }
] as const;

export const MONTHLY_REPEAT_OPTIONS: readonly { label: string; value: MonthlyRepeatPolicy }[] = [
  { label: "Remind every day", value: "daily" },
  { label: "Remind every 3 days", value: "every3Days" },
  { label: "Don't remind again", value: "never" }
] as const;

export const DEFAULT_SHARED_FREQUENCY: SharedReminderFrequency = "daily";
export const DEFAULT_MONTHLY_REPEAT_POLICY: MonthlyRepeatPolicy = "daily";

export const NOTIFICATION_MESSAGES = {
  disabledBanner: "Notifications are disabled for Money Vault.",
  openSettings: "Open Device Settings",
  permissionDenied: "Notifications are disabled.\nEnable them in device settings.",
  reminderUpdated: "Reminder updated.",
  unexpectedError: "Something went wrong. Try again."
} as const;

export const NOTIFICATION_COPY = {
  muteDescription: "Temporarily disable all Money Vault notifications.",
  muteFooter: "You won't receive any notifications while muted.",
  muteTitle: "Mute All Notifications",
  monthlyRepeatTitle: "If Monthly Review is not completed",
  monthlySubtitle: "Review your financial cycle at month end.",
  monthlyTitle: "Monthly Review",
  screenTitle: "Notifications",
  sharedFrequencyTitle: "Frequency",
  sharedOption: "Only remind me if there's an outstanding balance.",
  sharedSubtitle: "Get nudged when shared balances need attention.",
  sharedTitle: "Shared Settlements"
} as const;

export const DEEP_LINK_ROUTES = {
  monthlyReview: "/planning?openReview=1",
  sharedSettlement: "/shared?openSettlement=1"
} as const;

export type ReminderType = "sharedSettlement" | "monthlyReview";

export type NotificationDeepLinkType = ReminderType;

export function sharedFrequencyIntervalDays(frequency: SharedReminderFrequency) {
  switch (frequency) {
    case "daily":
      return 1;
    case "every3Days":
      return 3;
    case "weekly":
      return 7;
  }
}

export function monthlyRepeatIntervalDays(policy: MonthlyRepeatPolicy) {
  switch (policy) {
    case "daily":
      return 1;
    case "every3Days":
      return 3;
    case "never":
      return null;
  }
}

export function sharedFrequencyLabel(frequency: SharedReminderFrequency) {
  return SHARED_FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ?? "Daily";
}

export function monthlyRepeatSummaryLabel(policy: MonthlyRepeatPolicy) {
  switch (policy) {
    case "daily":
      return "Daily until completed";
    case "every3Days":
      return "Every 3 days until completed";
    case "never":
      return "Once at cycle end";
  }
}
