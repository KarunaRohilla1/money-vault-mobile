import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { cycleDays } from "@/features/onboarding/onboardingOptions";
import { InfoPanel, StepIntro } from "@/features/onboarding/steps/stepUi";
import { theme } from "@/theme";

export function FinancialCycleStep({ patchField, values }: OnboardingStepProps) {
  const [open, setOpen] = useState(false);
  const selectedDay = values.cycleStartDay ?? null;

  return (
    <View className="gap-4">
      <StepIntro
        title="Set your monthly financial cycle"
        subtitle="We'll organize your income, expenses, and commitments around this cycle."
      />
      <Pressable
        accessibilityRole="button"
        className="h-14 flex-row items-center justify-between rounded-md border border-surface-border bg-background px-4"
        onPress={() => setOpen(true)}
      >
        <Text className={`font-sans text-base ${selectedDay ? "text-text" : "text-text-muted"}`}>
          {selectedDay ? `${selectedDay}${ordinalSuffix(selectedDay)} of every month` : "Select cycle start day"}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={theme.icons.md} color={theme.colors.text.muted} />
      </Pressable>
      <InfoPanel
        icon="calendar-month-outline"
        title="Your first cycle"
        body="Money Vault will generate your first financial cycle from the selected start day."
      />
      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/70 px-5 pb-8" onPress={() => setOpen(false)}>
          <Pressable className="max-h-[70%] rounded-lg border border-surface-border bg-surface p-4" onPress={(event) => event.stopPropagation()}>
            <Text className="px-2 pb-3 font-sans text-lg font-bold text-text">Cycle starts on</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {cycleDays.map((day) => {
                const active = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    className={`h-12 flex-row items-center justify-between rounded-md px-3 ${active ? "bg-brand-muted" : "bg-surface"}`}
                    onPress={() => {
                      patchField("cycleStartDay", day);
                      setOpen(false);
                    }}
                  >
                    <Text className="font-sans text-base text-text">{day}</Text>
                    {active ? <MaterialCommunityIcons name="check" size={theme.icons.md} color={theme.colors.brand.soft} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

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
