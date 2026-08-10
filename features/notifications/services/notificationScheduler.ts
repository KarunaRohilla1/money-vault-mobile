import {
  DEFAULT_REMINDER_TIME,
  monthlyRepeatSummaryLabel,
  sharedFrequencyLabel,
  type ReminderType
} from "@/features/notifications/constants/notifications";
import type { MonthlyReminderSettings, ReminderTime, SharedReminderSettings } from "@/features/notifications/types";

export function parseReminderTime(value: string): ReminderTime {
  const normalized = /^\d{2}:\d{2}$/u.test(value) ? value : DEFAULT_REMINDER_TIME;
  const [hourText, minuteText] = normalized.split(":");

  return {
    hour: Number(hourText),
    minute: Number(minuteText)
  };
}

export function formatReminderTime(value: string, locale = "en-US") {
  const { hour, minute } = parseReminderTime(value);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function serializeReminderTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function parseIsoDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function isSameCalendarDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function applyReminderTime(date: Date, time: string) {
  const { hour, minute } = parseReminderTime(time);
  const value = new Date(date);
  value.setSeconds(0, 0);
  value.setHours(hour, minute, 0, 0);
  return value;
}

export function nextFireDate(time: string, now = new Date()) {
  const fireAt = applyReminderTime(now, time);

  if (fireAt.getTime() <= now.getTime()) {
    return applyReminderTime(addDays(startOfDay(now), 1), time);
  }

  return fireAt;
}

export function nextIntervalFireDate(input: {
  intervalDays: number;
  lastFiredAt: string | null;
  now?: Date;
  time: string;
}) {
  const now = input.now ?? new Date();
  const nextDaily = nextFireDate(input.time, now);

  if (!input.lastFiredAt) {
    return nextDaily;
  }

  const lastFired = new Date(input.lastFiredAt);
  if (Number.isNaN(lastFired.getTime())) {
    return nextDaily;
  }

  const earliest = applyReminderTime(addDays(startOfDay(lastFired), input.intervalDays), input.time);
  return earliest.getTime() > nextDaily.getTime() ? earliest : nextDaily;
}

export function sharedReminderSubtitle(settings: Pick<SharedReminderSettings, "frequency" | "time">, locale = "en-US") {
  return `${sharedFrequencyLabel(settings.frequency)} • ${formatReminderTime(settings.time, locale)}`;
}

export function monthlyReminderSubtitle(settings: Pick<MonthlyReminderSettings, "repeatPolicy" | "time">, locale = "en-US") {
  return `${monthlyRepeatSummaryLabel(settings.repeatPolicy)} • ${formatReminderTime(settings.time, locale)}`;
}

export function reminderTypeFromData(data: Record<string, unknown> | undefined): ReminderType | null {
  const value = data?.reminderType;
  if (value === "sharedSettlement" || value === "monthlyReview") {
    return value;
  }

  return null;
}
