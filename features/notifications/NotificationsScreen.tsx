import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { MuteNotificationsCard } from "@/features/notifications/components/MuteNotificationsCard";
import { MonthlyReviewReminderSheet } from "@/features/notifications/components/MonthlyReviewReminderSheet";
import { NotificationReminderCard } from "@/features/notifications/components/NotificationReminderCard";
import { PermissionBanner } from "@/features/notifications/components/PermissionBanner";
import { SharedSettlementReminderSheet } from "@/features/notifications/components/SharedSettlementReminderSheet";
import { NOTIFICATION_COPY, NOTIFICATION_MESSAGES } from "@/features/notifications/constants/notifications";
import { useNotificationSettings } from "@/features/notifications/hooks/useNotificationSettings";
import {
  monthlyReminderSubtitle,
  sharedReminderSubtitle
} from "@/features/notifications/services/notificationScheduler";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans text-xs font-bold uppercase tracking-wide text-text-muted" maxFontSizeMultiplier={1.3}>
      {children}
    </Text>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const locale = useSettingsStore((state) => state.locale);
  const {
    isSaving,
    osNotificationsEnabled,
    refreshPermission,
    saveMonthlyReminder,
    saveSharedReminder,
    settings,
    toggleMute
  } = useNotificationSettings();
  const [sharedSheetVisible, setSharedSheetVisible] = useState(false);
  const [monthlySheetVisible, setMonthlySheetVisible] = useState(false);

  async function handleMute(next: boolean) {
    const result = await toggleMute(next);
    if (result.status === "error") {
      showToast(result.message);
    }
  }

  async function handleSharedSave(shared: typeof settings.shared) {
    const result = await saveSharedReminder(shared);

    if (result.status === "permission_denied") {
      showToast(NOTIFICATION_MESSAGES.permissionDenied);
      await refreshPermission();
      return;
    }

    if (result.status === "error") {
      showToast(result.message);
      return;
    }

    setSharedSheetVisible(false);
    showToast(NOTIFICATION_MESSAGES.reminderUpdated);
  }

  async function handleMonthlySave(monthly: typeof settings.monthly) {
    const result = await saveMonthlyReminder(monthly);

    if (result.status === "permission_denied") {
      showToast(NOTIFICATION_MESSAGES.permissionDenied);
      await refreshPermission();
      return;
    }

    if (result.status === "error") {
      showToast(result.message);
      return;
    }

    setMonthlySheetVisible(false);
    showToast(NOTIFICATION_MESSAGES.reminderUpdated);
  }

  return (
    <Screen contentClassName="gap-6 px-5 pb-28 pt-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, "/more")}
        >
          <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
        </Pressable>
        <Text className="font-sans text-2xl font-bold text-text" maxFontSizeMultiplier={1.3}>
          {NOTIFICATION_COPY.screenTitle}
        </Text>
        <View className="h-12 w-12 items-center justify-center">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="bell-outline" size={theme.icons.lg} />
        </View>
      </View>

      {!osNotificationsEnabled ? <PermissionBanner /> : null}

      <View className="gap-3">
        <SectionLabel>Reminders</SectionLabel>
        <View className="rounded-xl border border-surface-border bg-surface">
          <NotificationReminderCard
            enabled={settings.shared.enabled && !settings.muted}
            icon="account-group-outline"
            onPress={() => setSharedSheetVisible(true)}
            subtitle={sharedReminderSubtitle(settings.shared, locale)}
            title={NOTIFICATION_COPY.sharedTitle}
          />
          <NotificationReminderCard
            enabled={settings.monthly.enabled && !settings.muted}
            icon="calendar-check-outline"
            onPress={() => setMonthlySheetVisible(true)}
            subtitle={monthlyReminderSubtitle(settings.monthly, locale)}
            title={NOTIFICATION_COPY.monthlyTitle}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>General</SectionLabel>
        <MuteNotificationsCard disabled={isSaving} muted={settings.muted} onValueChange={(next) => void handleMute(next)} />
      </View>

      <SharedSettlementReminderSheet
        initial={settings.shared}
        locale={locale}
        onClose={() => setSharedSheetVisible(false)}
        onSave={(shared) => handleSharedSave(shared)}
        saving={isSaving}
        visible={sharedSheetVisible}
      />

      <MonthlyReviewReminderSheet
        initial={settings.monthly}
        locale={locale}
        onClose={() => setMonthlySheetVisible(false)}
        onSave={(monthly) => handleMonthlySave(monthly)}
        saving={isSaving}
        visible={monthlySheetVisible}
      />
    </Screen>
  );
}
