import { isRunningInExpoGo } from "expo";
import { Linking, Platform } from "react-native";

import { NOTIFICATION_CHANNELS } from "@/features/notifications/constants/notifications";
import { Notifications } from "@/features/notifications/services/nativeNotifications";

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

/** Android Expo Go lacks a working NotificationsChannelsProvider (SDK 53+). */
export function canUseAndroidNotificationChannels() {
  return Platform.OS === "android" && !isRunningInExpoGo();
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  try {
    const permissions = await Notifications.getPermissionsAsync();

    if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return "granted";
    }

    if (permissions.status === "undetermined" || permissions.canAskAgain) {
      return "undetermined";
    }

    return "denied";
  } catch {
    return "undetermined";
  }
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  const current = await getNotificationPermissionStatus();

  if (current === "granted") {
    return "granted";
  }

  try {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true
      }
    });

    if (requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return "granted";
    }

    return requested.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "denied";
  }
}

export async function ensureAndroidReminderChannel() {
  if (!canUseAndroidNotificationChannels()) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.reminders, {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: "Reminders",
      sound: "default"
    });
  } catch {
    // Channel APIs can still fail on incomplete native builds; scheduling may use defaults.
  }
}

export async function openDeviceNotificationSettings() {
  await Linking.openSettings();
}

export function areOsNotificationsEnabled(status: NotificationPermissionStatus) {
  return status === "granted";
}
