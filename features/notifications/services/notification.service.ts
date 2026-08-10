import { isRunningInExpoGo } from "expo";
import { router } from "expo-router";
import { Platform } from "react-native";

import { NOTIFICATION_CHANNELS } from "@/features/notifications/constants/notifications";
import { Notifications } from "@/features/notifications/services/nativeNotifications";
import {
  canUseAndroidNotificationChannels,
  ensureAndroidReminderChannel
} from "@/features/notifications/services/notificationPermissions";
import { reminderTypeFromData } from "@/features/notifications/services/notificationScheduler";
import type { ScheduledReminderContent } from "@/features/notifications/types";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
} catch {
  // Expo Go / incomplete native modules may reject handler registration.
}

export async function cancelScheduledNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore when native scheduling is unavailable (e.g. Android Expo Go).
  }
}

export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore when native scheduling is unavailable.
  }
}

export async function scheduleLocalNotification(input: {
  content: ScheduledReminderContent;
  fireAt: Date;
  notificationId: string;
}) {
  // Android Expo Go cannot create channels or reliably schedule locals after SDK 53.
  if (Platform.OS === "android" && isRunningInExpoGo()) {
    return;
  }

  await ensureAndroidReminderChannel();
  await cancelScheduledNotification(input.notificationId);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        body: input.content.body,
        data: input.content.data,
        sound: "default",
        title: input.content.title,
        ...(canUseAndroidNotificationChannels() ? { channelId: NOTIFICATION_CHANNELS.reminders } : {})
      },
      identifier: input.notificationId,
      trigger: {
        date: input.fireAt,
        type: Notifications.SchedulableTriggerInputTypes.DATE
      }
    });
  } catch {
    // Keep settings/engine usable when the OS rejects scheduling.
  }
}

export function resolveNotificationRoute(data: Record<string, unknown> | undefined) {
  if (typeof data?.route === "string" && data.route.length > 0) {
    return data.route;
  }

  const reminderType = reminderTypeFromData(data);
  if (reminderType === "sharedSettlement") {
    return "/shared?openSettlement=1";
  }

  if (reminderType === "monthlyReview") {
    return "/planning?openReview=1";
  }

  return null;
}

export function navigateFromNotificationData(data: Record<string, unknown> | undefined) {
  const route = resolveNotificationRoute(data);
  if (!route) {
    return;
  }

  router.push(route as never);
}

export function addNotificationReceivedListener(listener: (data: Record<string, unknown> | undefined) => void) {
  try {
    return Notifications.addNotificationReceivedListener((notification) => {
      listener(notification.request.content.data as Record<string, unknown> | undefined);
    });
  } catch {
    return { remove: () => undefined };
  }
}

export function addNotificationResponseListener(listener: (data: Record<string, unknown> | undefined) => void) {
  try {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      listener(response.notification.request.content.data as Record<string, unknown> | undefined);
    });
  } catch {
    return { remove: () => undefined };
  }
}

export async function getLastNotificationResponseData() {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data as Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
}
