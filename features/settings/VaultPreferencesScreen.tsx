import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ErrorView, LoadingSkeleton, PrimaryButton } from "@/components/ui";
import { cycleDays } from "@/features/onboarding/onboardingOptions";
import { useSettingsQuery } from "@/features/settings/api";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function ordinalSuffix(value: number) {
  if (value % 100 >= 11 && value % 100 <= 13) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function VaultPreferencesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const settingsQuery = useSettingsQuery(token, vaultId);

  const [cycleStartDay, setCycleStartDay] = useState<number>(1);
  const [savingsGoal, setSavingsGoal] = useState<string>("");
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCycleStartDay(settingsQuery.data.cycleStartDay || 1);
      setSavingsGoal(
        settingsQuery.data.monthlySavingsGoal !== undefined && settingsQuery.data.monthlySavingsGoal !== null
          ? String(settingsQuery.data.monthlySavingsGoal)
          : ""
      );
    }
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }

      const parsedGoal = savingsGoal.trim() ? Number(savingsGoal.trim()) : 0;
      return apiClient.updateSettings(token, {
        cycleStartDay,
        monthlySavingsGoal: Number.isFinite(parsedGoal) ? parsedGoal : 0
      });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Preferences could not be saved. Try again.");
      }
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(queryKeys.settings.effective(vaultId), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.planning.current(vaultId) });
      showToast("Preferences updated successfully.");
    }
  });

  const handleSave = () => {
    setError(null);
    updateMutation.mutate();
  };

  return (
    <Screen contentClassName="gap-6 px-5 pb-28 pt-4">
      <View className="relative items-center gap-3 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, "/more")}
        >
          <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
        </Pressable>

        <View className="h-16 w-16 items-center justify-center">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="tune-vertical" size={48} />
        </View>

        <Text className="font-sans text-3xl font-bold text-text" maxFontSizeMultiplier={1.3}>
          Preferences
        </Text>
        <Text className="px-6 text-center font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
          Manage your monthly financial cycle and savings goal
        </Text>
      </View>

      {settingsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {settingsQuery.isError ? (
        <ErrorView message="Settings could not be loaded." onRetry={() => settingsQuery.refetch()} />
      ) : null}

      {settingsQuery.data ? (
        <View className="gap-5">
          {error ? (
            <View className="rounded-lg border border-state-danger/40 bg-surface-pressed p-3">
              <Text className="font-sans text-sm font-semibold text-state-danger">{error}</Text>
            </View>
          ) : null}

          {/* Financial Cycle Start Day */}
          <View className="gap-2 rounded-xl border border-surface-border bg-surface p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons color={theme.colors.brand.soft} name="calendar-month-outline" size={theme.icons.md} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-base font-bold text-text">Month Start Day</Text>
                <Text className="font-sans text-xs text-text-muted">Day your financial cycle starts each month</Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Select Month Start Day"
              accessibilityRole="button"
              className="mt-3 h-14 flex-row items-center justify-between rounded-lg border border-surface-border bg-background-muted px-4"
              onPress={() => setDayPickerOpen(true)}
            >
              <Text className="font-sans text-base font-semibold text-text">
                {cycleStartDay}
                {ordinalSuffix(cycleStartDay)} of every month
              </Text>
              <MaterialCommunityIcons color={theme.colors.text.muted} name="chevron-down" size={theme.icons.md} />
            </Pressable>
          </View>

          {/* Monthly Savings Goal */}
          <View className="gap-2 rounded-xl border border-surface-border bg-surface p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons color={theme.colors.brand.soft} name="bullseye-arrow" size={theme.icons.md} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-base font-bold text-text">Monthly Savings Goal</Text>
                <Text className="font-sans text-xs text-text-muted">Target amount you plan to save this cycle</Text>
              </View>
            </View>

            <View className="mt-3">
              <FormField label="Target Amount">
                <TextInput
                  accessibilityLabel="Monthly savings goal input"
                  className="h-12 rounded-lg border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
                  inputMode="decimal"
                  keyboardType="numeric"
                  onChangeText={setSavingsGoal}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.text.muted}
                  value={savingsGoal}
                />
              </FormField>
            </View>
          </View>

          <PrimaryButton
            disabled={updateMutation.isPending}
            loading={updateMutation.isPending}
            onPress={handleSave}
          >
            Save Preferences
          </PrimaryButton>
        </View>
      ) : null}

      {/* Day Picker Modal */}
      <Modal animationType="fade" onRequestClose={() => setDayPickerOpen(false)} transparent visible={dayPickerOpen}>
        <Pressable className="flex-1 justify-end bg-black/70 px-5 pb-8" onPress={() => setDayPickerOpen(false)}>
          <Pressable className="max-h-[70%] rounded-xl border border-surface-border bg-surface p-4" onPress={(event) => event.stopPropagation()}>
            <Text className="px-2 pb-3 font-sans text-lg font-bold text-text">Cycle starts on</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {cycleDays.map((day) => {
                const active = day === cycleStartDay;
                return (
                  <Pressable
                    key={day}
                    className={`h-12 flex-row items-center justify-between rounded-lg px-3 ${active ? "bg-brand-muted" : "bg-surface"}`}
                    onPress={() => {
                      setCycleStartDay(day);
                      setDayPickerOpen(false);
                    }}
                  >
                    <Text className="font-sans text-base font-semibold text-text">
                      {day}
                      {ordinalSuffix(day)} of every month
                    </Text>
                    {active ? <MaterialCommunityIcons color={theme.colors.brand.soft} name="check" size={theme.icons.md} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
