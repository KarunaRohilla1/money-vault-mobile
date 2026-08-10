import {
  DEFAULT_MONTHLY_REPEAT_POLICY,
  DEFAULT_REMINDER_TIME,
  DEFAULT_SHARED_FREQUENCY,
  MONTHLY_REPEAT_OPTIONS,
  NOTIFICATION_STORAGE_KEYS,
  SHARED_FREQUENCY_OPTIONS,
  type MonthlyRepeatPolicy,
  type SharedReminderFrequency
} from "@/features/notifications/constants/notifications";
import type { NotificationSettings } from "@/features/notifications/types";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem
} from "@/features/settings/security/services/secureStorage.service";

function parseBoolean(value: string | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  return value === "true";
}

function parseTime(value: string | null) {
  if (!value || !/^\d{2}:\d{2}$/u.test(value)) {
    return DEFAULT_REMINDER_TIME;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return DEFAULT_REMINDER_TIME;
  }

  return value;
}

function parseSharedFrequency(value: string | null): SharedReminderFrequency {
  if (value && SHARED_FREQUENCY_OPTIONS.some((option) => option.value === value)) {
    return value as SharedReminderFrequency;
  }

  return DEFAULT_SHARED_FREQUENCY;
}

function parseMonthlyRepeatPolicy(value: string | null, legacyRepeatUntilReviewed: string | null): MonthlyRepeatPolicy {
  if (value && MONTHLY_REPEAT_OPTIONS.some((option) => option.value === value)) {
    return value as MonthlyRepeatPolicy;
  }

  if (legacyRepeatUntilReviewed === "false") {
    return "never";
  }

  return DEFAULT_MONTHLY_REPEAT_POLICY;
}

export function createDefaultNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    monthly: {
      enabled: false,
      lastFiredAt: null,
      repeatPolicy: DEFAULT_MONTHLY_REPEAT_POLICY,
      time: DEFAULT_REMINDER_TIME
    },
    muted: false,
    shared: {
      enabled: false,
      frequency: DEFAULT_SHARED_FREQUENCY,
      lastFiredAt: null,
      onlyOutstanding: true,
      time: DEFAULT_REMINDER_TIME
    }
  };
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const [
    enabled,
    muted,
    sharedEnabled,
    sharedTime,
    sharedFrequency,
    sharedOnlyOutstanding,
    sharedLastFiredAt,
    monthlyEnabled,
    monthlyTime,
    monthlyRepeatPolicy,
    monthlyLastFiredAt,
    legacyMonthlyRepeatUntilReviewed
  ] = await Promise.all([
    getSecureItem(NOTIFICATION_STORAGE_KEYS.enabled),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.muted),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.sharedEnabled),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.sharedTime),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.sharedFrequency),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.sharedOnlyOutstanding),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.sharedLastFiredAt),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyEnabled),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyTime),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyRepeatPolicy),
    getSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyLastFiredAt),
    getSecureItem("notifications.monthly.repeatUntilReviewed")
  ]);

  return {
    enabled: parseBoolean(enabled, false),
    monthly: {
      enabled: parseBoolean(monthlyEnabled, false),
      lastFiredAt: monthlyLastFiredAt,
      repeatPolicy: parseMonthlyRepeatPolicy(monthlyRepeatPolicy, legacyMonthlyRepeatUntilReviewed),
      time: parseTime(monthlyTime)
    },
    muted: parseBoolean(muted, false),
    shared: {
      enabled: parseBoolean(sharedEnabled, false),
      frequency: parseSharedFrequency(sharedFrequency),
      lastFiredAt: sharedLastFiredAt,
      onlyOutstanding: parseBoolean(sharedOnlyOutstanding, true),
      time: parseTime(sharedTime)
    }
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await Promise.all([
    setSecureItem(NOTIFICATION_STORAGE_KEYS.enabled, String(settings.enabled)),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.muted, String(settings.muted)),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.sharedEnabled, String(settings.shared.enabled)),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.sharedTime, settings.shared.time),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.sharedFrequency, settings.shared.frequency),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.sharedOnlyOutstanding, String(settings.shared.onlyOutstanding)),
    settings.shared.lastFiredAt
      ? setSecureItem(NOTIFICATION_STORAGE_KEYS.sharedLastFiredAt, settings.shared.lastFiredAt)
      : deleteSecureItem(NOTIFICATION_STORAGE_KEYS.sharedLastFiredAt).catch(() => undefined),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyEnabled, String(settings.monthly.enabled)),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyTime, settings.monthly.time),
    setSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyRepeatPolicy, settings.monthly.repeatPolicy),
    settings.monthly.lastFiredAt
      ? setSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyLastFiredAt, settings.monthly.lastFiredAt)
      : deleteSecureItem(NOTIFICATION_STORAGE_KEYS.monthlyLastFiredAt).catch(() => undefined),
    deleteSecureItem("notifications.monthly.repeatUntilReviewed").catch(() => undefined)
  ]);
}

export async function clearNotificationSettings(): Promise<void> {
  await Promise.all(Object.values(NOTIFICATION_STORAGE_KEYS).map((key) => deleteSecureItem(key).catch(() => undefined)));
}

export async function markReminderFired(kind: "shared" | "monthly", firedAt: Date) {
  const key = kind === "shared" ? NOTIFICATION_STORAGE_KEYS.sharedLastFiredAt : NOTIFICATION_STORAGE_KEYS.monthlyLastFiredAt;
  await setSecureItem(key, firedAt.toISOString());
}
