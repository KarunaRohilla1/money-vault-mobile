import type {
  MonthlyRepeatPolicy,
  ReminderType,
  SharedReminderFrequency
} from "@/features/notifications/constants/notifications";

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface SharedReminderSettings {
  enabled: boolean;
  frequency: SharedReminderFrequency;
  lastFiredAt: string | null;
  onlyOutstanding: boolean;
  time: string;
}

export interface MonthlyReminderSettings {
  enabled: boolean;
  lastFiredAt: string | null;
  repeatPolicy: MonthlyRepeatPolicy;
  time: string;
}

export interface NotificationSettings {
  enabled: boolean;
  monthly: MonthlyReminderSettings;
  muted: boolean;
  shared: SharedReminderSettings;
}

export interface ScheduledReminderContent {
  body: string;
  data: {
    reminderType: ReminderType;
    route: string;
  };
  title: string;
}

export type ReminderEvaluation =
  | { action: "cancel" }
  | {
      action: "schedule";
      content: ScheduledReminderContent;
      fireAt: Date;
    };

export interface ReminderContext {
  currencyCode: string;
  locale: string;
  now: Date;
  settings: NotificationSettings;
  token: string | null;
  vaultId: string | null;
}

export interface ReminderStrategy {
  readonly id: string;
  readonly type: ReminderType;
  evaluate(context: ReminderContext): Promise<ReminderEvaluation>;
}
