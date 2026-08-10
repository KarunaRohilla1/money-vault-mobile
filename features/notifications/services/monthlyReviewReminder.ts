import {
  DEEP_LINK_ROUTES,
  monthlyRepeatIntervalDays,
  NOTIFICATION_IDS
} from "@/features/notifications/constants/notifications";
import {
  applyReminderTime,
  isSameCalendarDay,
  nextFireDate,
  nextIntervalFireDate,
  parseIsoDateOnly,
  startOfDay
} from "@/features/notifications/services/notificationScheduler";
import type { ReminderContext, ReminderEvaluation, ReminderStrategy } from "@/features/notifications/types";
import { getPlanning } from "@/services/api/planning";

function cycleMonthLabel(cycle: { displayLabel?: string; displayMonth?: string; endDate: string; startDate: string }, locale: string) {
  if (cycle.displayMonth?.trim()) {
    return cycle.displayMonth.trim();
  }

  if (cycle.displayLabel?.trim()) {
    return cycle.displayLabel.trim();
  }

  return new Intl.DateTimeFormat(locale, { month: "long" }).format(parseIsoDateOnly(cycle.startDate));
}

function isCycleReviewed(cycle: {
  closedAt?: string | null;
  isCompleted?: boolean;
  status: string;
}) {
  if (cycle.isCompleted) {
    return true;
  }

  if (cycle.closedAt) {
    return true;
  }

  const status = cycle.status.trim().toLowerCase();
  return status === "completed" || status === "closed" || status === "reviewed";
}

function isCycleEndOrPastDue(cycle: { daysRemaining?: number; endDate: string }, now: Date) {
  const today = startOfDay(now);
  const endDate = startOfDay(parseIsoDateOnly(cycle.endDate));

  if (isSameCalendarDay(today, endDate) || today.getTime() > endDate.getTime()) {
    return true;
  }

  if (typeof cycle.daysRemaining === "number" && cycle.daysRemaining <= 0) {
    return true;
  }

  return false;
}

function firstCycleReminderFireAt(cycleEndDate: Date, time: string, now: Date) {
  const onEndDay = applyReminderTime(cycleEndDate, time);

  if (onEndDay.getTime() > now.getTime()) {
    return onEndDay;
  }

  return nextFireDate(time, now);
}

export const monthlyReviewReminder: ReminderStrategy = {
  id: NOTIFICATION_IDS.monthlyReview,
  type: "monthlyReview",

  async evaluate(context: ReminderContext): Promise<ReminderEvaluation> {
    const { settings } = context;

    if (!settings.monthly.enabled || settings.muted || !settings.enabled) {
      return { action: "cancel" };
    }

    if (!context.token) {
      return { action: "cancel" };
    }

    try {
      const planning = await getPlanning(context.token);
      const cycle = planning.cycle;
      const reviewed = isCycleReviewed(cycle);

      if (reviewed) {
        return { action: "cancel" };
      }

      if (!isCycleEndOrPastDue(cycle, context.now)) {
        return { action: "cancel" };
      }

      const cycleEnd = startOfDay(parseIsoDateOnly(cycle.endDate));
      const lastFiredAt = settings.monthly.lastFiredAt;
      const intervalDays = monthlyRepeatIntervalDays(settings.monthly.repeatPolicy);

      if (intervalDays === null) {
        // "Don't remind again" — only the first (cycle-end) reminder.
        if (lastFiredAt) {
          return { action: "cancel" };
        }

        return {
          action: "schedule",
          content: {
            body: `Time to review your ${cycleMonthLabel(cycle, context.locale)} Financial Cycle.\nTap to complete your monthly review.`,
            data: {
              reminderType: "monthlyReview",
              route: DEEP_LINK_ROUTES.monthlyReview
            },
            title: "Money Vault"
          },
          fireAt: firstCycleReminderFireAt(cycleEnd, settings.monthly.time, context.now)
        };
      }

      const fireAt = lastFiredAt
        ? nextIntervalFireDate({
            intervalDays,
            lastFiredAt,
            now: context.now,
            time: settings.monthly.time
          })
        : firstCycleReminderFireAt(cycleEnd, settings.monthly.time, context.now);

      return {
        action: "schedule",
        content: {
          body: `Time to review your ${cycleMonthLabel(cycle, context.locale)} Financial Cycle.\nTap to complete your monthly review.`,
          data: {
            reminderType: "monthlyReview",
            route: DEEP_LINK_ROUTES.monthlyReview
          },
          title: "Money Vault"
        },
        fireAt
      };
    } catch {
      return { action: "cancel" };
    }
  }
};
