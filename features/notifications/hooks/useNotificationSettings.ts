import { useCallback, useEffect, useState } from "react";

import { NOTIFICATION_MESSAGES } from "@/features/notifications/constants/notifications";
import { notificationEngine } from "@/features/notifications/services/notificationEngine";
import {
  areOsNotificationsEnabled,
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  type NotificationPermissionStatus
} from "@/features/notifications/services/notificationPermissions";
import type { MonthlyReminderSettings, NotificationSettings, SharedReminderSettings } from "@/features/notifications/types";
import { SecureStorageError } from "@/features/settings/security/services/secureStorage.service";

export type NotificationSettingsUpdateResult =
  | { status: "saved"; settings: NotificationSettings }
  | { status: "permission_denied"; settings: NotificationSettings }
  | { status: "error"; message: string };

function errorMessage(error: unknown) {
  if (error instanceof SecureStorageError) {
    return NOTIFICATION_MESSAGES.unexpectedError;
  }

  return error instanceof Error ? error.message : NOTIFICATION_MESSAGES.unexpectedError;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(notificationEngine.getSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return notificationEngine.subscribe((next) => {
      setSettings(next);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydratePermission() {
      const status = await getNotificationPermissionStatus();
      if (!cancelled) {
        setPermissionStatus(status);
      }
    }

    void hydratePermission();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  const ensurePermissionForEnable = useCallback(async () => {
    const status = await requestNotificationPermissions();
    setPermissionStatus(status);
    return areOsNotificationsEnabled(status);
  }, []);

  const updateSettings = useCallback(async (next: NotificationSettings): Promise<NotificationSettingsUpdateResult> => {
    setIsSaving(true);

    try {
      await notificationEngine.updateSettings(next);
      setSettings(next);
      return { settings: next, status: "saved" };
    } catch (error: unknown) {
      return { message: errorMessage(error), status: "error" };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const toggleMute = useCallback(async (muted: boolean) => {
    return updateSettings({ ...settings, muted });
  }, [settings, updateSettings]);

  const toggleReminder = useCallback(async (
    type: "shared" | "monthly",
    enabled: boolean
  ): Promise<NotificationSettingsUpdateResult> => {
    if (enabled) {
      const granted = await ensurePermissionForEnable();
      if (!granted) {
        return { settings, status: "permission_denied" };
      }
    }

    const next: NotificationSettings = {
      ...settings,
      enabled: enabled ? true : settings.enabled || settings.shared.enabled || settings.monthly.enabled,
      [type]: {
        ...settings[type],
        enabled
      }
    };

    if (enabled) {
      next.enabled = true;
    }

    return updateSettings(next);
  }, [ensurePermissionForEnable, settings, updateSettings]);

  const saveSharedReminder = useCallback(async (shared: SharedReminderSettings): Promise<NotificationSettingsUpdateResult> => {
    if (shared.enabled) {
      const granted = await ensurePermissionForEnable();
      if (!granted) {
        return { settings, status: "permission_denied" };
      }
    }

    return updateSettings({
      ...settings,
      enabled: shared.enabled ? true : settings.enabled,
      shared
    });
  }, [ensurePermissionForEnable, settings, updateSettings]);

  const saveMonthlyReminder = useCallback(async (monthly: MonthlyReminderSettings): Promise<NotificationSettingsUpdateResult> => {
    if (monthly.enabled) {
      const granted = await ensurePermissionForEnable();
      if (!granted) {
        return { settings, status: "permission_denied" };
      }
    }

    return updateSettings({
      ...settings,
      enabled: monthly.enabled ? true : settings.enabled,
      monthly
    });
  }, [ensurePermissionForEnable, settings, updateSettings]);

  return {
    isLoading,
    isSaving,
    osNotificationsEnabled: areOsNotificationsEnabled(permissionStatus),
    permissionStatus,
    refreshPermission,
    saveMonthlyReminder,
    saveSharedReminder,
    settings,
    toggleMute,
    toggleReminder,
    updateSettings
  };
}
