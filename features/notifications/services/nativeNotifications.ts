/**
 * Local-notification APIs only.
 *
 * Importing the `expo-notifications` barrel pulls in DevicePushTokenAutoRegistration,
 * which throws on Android Expo Go (SDK 53+) because remote push was removed there.
 * Deep imports keep local scheduling/permissions working in Expo Go.
 */
import { cancelAllScheduledNotificationsAsync } from "expo-notifications/build/cancelAllScheduledNotificationsAsync";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import {
  getPermissionsAsync,
  requestPermissionsAsync
} from "expo-notifications/build/NotificationPermissions";
import { IosAuthorizationStatus } from "expo-notifications/build/NotificationPermissions.types";
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync
} from "expo-notifications/build/NotificationsEmitter";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";

export const Notifications = {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getLastNotificationResponseAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler
};
