import {
  DEEP_LINK_ROUTES,
  NOTIFICATION_IDS,
  sharedFrequencyIntervalDays
} from "@/features/notifications/constants/notifications";
import { nextIntervalFireDate } from "@/features/notifications/services/notificationScheduler";
import type { ReminderContext, ReminderEvaluation, ReminderStrategy } from "@/features/notifications/types";
import { formatCurrency } from "@/lib/format";
import { getSharedSettlements } from "@/services/api/shared";
import type { CurrencyCode } from "@/types/domain";

function isOutstandingDirection(direction: string) {
  const normalized = direction.trim().toLowerCase();
  return normalized !== "settled" && normalized !== "none" && normalized.length > 0;
}

function userOwes(direction: string) {
  const normalized = direction.trim().toLowerCase();
  return normalized === "payable" || normalized.includes("you_owe") || normalized === "owe" || (normalized.includes("owe") && !normalized.includes("owed"));
}

function buildSharedSettlementCopy(input: {
  amount: number;
  counterpartyName: string;
  currencyCode: string;
  locale: string;
  owes: boolean;
}) {
  const amountLabel = formatCurrency(input.amount, input.currencyCode as CurrencyCode, input.locale);

  if (input.owes) {
    return {
      body: `You owe ${input.counterpartyName} ${amountLabel}.\nTap to mark it as settled.`,
      title: "Money Vault"
    };
  }

  return {
    body: `${input.counterpartyName} owes you ${amountLabel}.\nTap to review.`,
    title: "Money Vault"
  };
}

export const sharedSettlementReminder: ReminderStrategy = {
  id: NOTIFICATION_IDS.sharedSettlement,
  type: "sharedSettlement",

  async evaluate(context: ReminderContext): Promise<ReminderEvaluation> {
    const { settings } = context;

    if (!settings.shared.enabled || settings.muted || !settings.enabled) {
      return { action: "cancel" };
    }

    if (!context.token) {
      return { action: "cancel" };
    }

    let outstanding = false;
    let content = {
      body: "Review your shared settlements.",
      title: "Money Vault"
    };

    try {
      const response = await getSharedSettlements(context.token);
      const settlement = response.data;
      outstanding = isOutstandingDirection(settlement.direction) && settlement.amount > 0;

      if (outstanding) {
        const item = settlement.items.find((entry) => entry.amount > 0);
        const direction = item?.direction || settlement.direction;
        const owes = userOwes(direction);
        const counterpartyName =
          item?.counterparty_name ||
          (owes ? item?.to_name : item?.from_name) ||
          "your partner";

        content = buildSharedSettlementCopy({
          amount: item?.amount ?? settlement.amount,
          counterpartyName,
          currencyCode: context.currencyCode,
          locale: context.locale,
          owes
        });
      }
    } catch {
      return { action: "cancel" };
    }

    // Hard rule: remind only when outstanding > 0; cancel immediately when balance is zero.
    if (!outstanding) {
      return { action: "cancel" };
    }

    return {
      action: "schedule",
      content: {
        body: content.body,
        data: {
          reminderType: "sharedSettlement",
          route: DEEP_LINK_ROUTES.sharedSettlement
        },
        title: content.title
      },
      fireAt: nextIntervalFireDate({
        intervalDays: sharedFrequencyIntervalDays(settings.shared.frequency),
        lastFiredAt: settings.shared.lastFiredAt,
        now: context.now,
        time: settings.shared.time
      })
    };
  }
};
