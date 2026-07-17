import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, Text, TextInput, View } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  ensurePersonalVault,
  generateFirstFinancialCycle,
  markOnboardingComplete,
  saveFirstAccount,
  saveMonthlySavingsGoal,
  saveNotificationPreference,
  saveVaultName
} from "@/services/api/onboarding";
import { useAuthStore } from "@/stores/authStore";
import {
  EMPTY_ONBOARDING_DRAFT,
  getVaultOnboardingState,
  ONBOARDING_STEPS,
  type OnboardingAccountKind,
  type OnboardingDraft,
  type OnboardingStep,
  useOnboardingStore
} from "@/stores/onboardingStore";
import { theme } from "@/theme";
import type { IconName } from "@/constants/navigation";

const accountOptions: OnboardingAccountKind[] = ["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"];
const cycleDays = [1, 5, 10, 15, 20, 25];

const vaultNameSchema = z.object({
  vaultName: z.string().trim().min(1, "Vault name is required.")
});
const firstAccountSchema = z.object({
  accountKind: z.enum(["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"], "Choose the first account type.")
});
const accountDetailsSchema = z.object({
  accountBank: z.string().trim().min(1, "Bank or provider is required."),
  accountName: z.string().trim().min(1, "Account name is required."),
  openingBalance: z.string().refine((value) => value.trim() === "" || Number(value) >= 0, "Opening balance cannot be negative.")
});
const cycleSchema = z.object({
  cycleStartDay: z.number().int().refine((value) => cycleDays.includes(value), "Choose a cycle start day.")
});
const savingsSchema = z.object({
  monthlySavingsGoal: z.string().refine((value) => value.trim() === "" || Number(value) >= 0, "Savings goal cannot be negative.")
});

function nextStep(step: OnboardingStep) {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)] ?? "finish";
}

function previousStep(step: OnboardingStep) {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.max(index - 1, 0)] ?? "welcome";
}

function usernameFromVaultName(vaultName: string | undefined) {
  if (!vaultName) {
    return "Your";
  }

  return vaultName.replace(/'s Vault$/u, "").trim() || "Your";
}

function defaultVaultName(vaultName: string | undefined) {
  return `${usernameFromVaultName(vaultName)}'s Vault`;
}

export function OnboardingScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const setStep = useOnboardingStore((state) => state.setStep);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const completeVault = useOnboardingStore((state) => state.completeVault);
  const persisted = getVaultOnboardingState(vaultId);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const step = persisted.step;
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const {
    control,
    getValues,
    setValue
  } = useForm<OnboardingDraft>({
    defaultValues: {
      ...EMPTY_ONBOARDING_DRAFT,
      ...persisted.draft
    }
  });
  const values = useWatch({ control });
  const screenTitle = useMemo(() => {
    switch (step) {
      case "welcome":
        return "Welcome";
      case "vault-name":
        return "Vault name";
      case "first-account":
        return "First account";
      case "account-details":
        return "Account details";
      case "financial-cycle":
        return "Financial cycle";
      case "savings-goal":
        return "Savings goal";
      case "notifications":
        return "Notifications";
      case "finish":
        return "Ready";
    }
  }, [step]);

  useEffect(() => {
    if (!vaultId) {
      return;
    }

    if (!getValues("vaultName")) {
      const fallbackName = defaultVaultName(vault?.name);
      setValue("vaultName", fallbackName);
      updateDraft(vaultId, { vaultName: fallbackName, vaultType: "Personal Vault" });
    }
  }, [getValues, setValue, updateDraft, vault?.name, vaultId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!vaultId || step === "welcome") {
        return false;
      }

      setStep(vaultId, previousStep(step));
      return true;
    });

    return () => subscription.remove();
  }, [setStep, step, vaultId]);

  const patchField = <TKey extends keyof OnboardingDraft>(field: TKey, value: OnboardingDraft[TKey]) => {
    setValue(field, value as never, { shouldDirty: true });
    if (vaultId) {
      updateDraft(vaultId, { [field]: value });
    }
  };

  const goBack = () => {
    if (vaultId && step !== "welcome") {
      setStep(vaultId, previousStep(step));
    }
  };

  const continueTo = async (targetStep?: OnboardingStep) => {
    if (!vaultId || !token) {
      return;
    }

    setStepError(null);
    const current = getValues();
    const result = validateStep(step, current);

    if (!result.ok) {
      setStepError(result.message);
      return;
    }

    setSaving(true);
    try {
      await persistStep(token, vaultId, step, current);
      setStep(vaultId, targetStep ?? nextStep(step));
    } catch {
      setStepError("This onboarding step could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!vaultId || !token) {
      return;
    }

    setSaving(true);
    setStepError(null);
    try {
      await markOnboardingComplete(token, vaultId);
      completeVault(vaultId);
      router.replace("/" as never);
    } catch {
      setStepError("Onboarding could not be completed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={screenTitle} description={`Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`} />
      <View className="gap-5 rounded-lg border border-surface-border bg-background-muted p-5">
        <ProgressDots currentIndex={stepIndex} total={ONBOARDING_STEPS.length} />
        {renderStep({
          control,
          goToNext: continueTo,
          patchField,
          values,
          saving,
          step
        })}
        {stepError ? <Text className="font-sans text-sm text-state-danger">{stepError}</Text> : null}
        <View className="flex-row gap-3">
          {step !== "welcome" ? <SecondaryButton disabled={saving} onPress={goBack}>Back</SecondaryButton> : null}
          {step !== "finish" ? (
            <PrimaryButton loading={saving} disabled={saving} onPress={() => continueTo()}>
              {step === "welcome" ? "Continue" : "Continue"}
            </PrimaryButton>
          ) : (
            <PrimaryButton loading={saving} disabled={saving} onPress={finish}>
              Go to Dashboard
            </PrimaryButton>
          )}
        </View>
      </View>
    </Screen>
  );
}

function validateStep(step: OnboardingStep, values: OnboardingDraft): { message: string; ok: false } | { ok: true } {
  const message = validationMessage(step, values);

  if (!message) {
    return { ok: true };
  }

  return {
    message,
    ok: false
  };
}

function validationMessage(step: OnboardingStep, values: OnboardingDraft) {
  switch (step) {
    case "vault-name":
      return vaultNameSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "first-account":
      return firstAccountSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "account-details":
      return accountDetailsSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "financial-cycle":
      return cycleSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "savings-goal":
      return savingsSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "welcome":
    case "notifications":
    case "finish":
      return null;
  }
}

async function persistStep(token: string, vaultId: string, step: OnboardingStep, values: OnboardingDraft) {
  switch (step) {
    case "welcome":
      await ensurePersonalVault(token, useAuthStore.getState().vault);
      return;
    case "vault-name":
      await saveVaultName(token, vaultId, values.vaultName.trim());
      return;
    case "account-details":
      await saveFirstAccount(token, vaultId, values);
      return;
    case "financial-cycle":
      await generateFirstFinancialCycle(token, vaultId, values.cycleStartDay ?? 1);
      return;
    case "savings-goal":
      await saveMonthlySavingsGoal(token, vaultId, values.monthlySavingsGoal.trim());
      return;
    case "notifications":
      await saveNotificationPreference(token, vaultId, values.notificationsEnabled === true);
      return;
    case "first-account":
    case "finish":
      return;
  }
}

function renderStep({
  control,
  goToNext,
  patchField,
  saving,
  step,
  values
}: {
  control: ReturnType<typeof useForm<OnboardingDraft>>["control"];
  goToNext: (targetStep?: OnboardingStep) => Promise<void>;
  patchField: <TKey extends keyof OnboardingDraft>(field: TKey, value: OnboardingDraft[TKey]) => void;
  saving: boolean;
  step: OnboardingStep;
  values: Partial<OnboardingDraft>;
}) {
  switch (step) {
    case "welcome":
      return (
        <View className="items-center gap-5">
          <IconHero icon="safe-square-outline" />
          <View className="gap-3">
            <Text className="text-center font-sans text-2xl font-bold text-text">Your money deserves a home.</Text>
            <Text className="text-center font-sans text-sm text-text-muted">
              Private, beautiful, and built around the way you manage your finances.
            </Text>
          </View>
          <FeaturePill icon="shield-check-outline" label="Encrypted session" />
        </View>
      );
    case "vault-name":
      return (
        <View className="items-center gap-5">
          <IconBadge icon="home-variant-outline" />
          <StepIntro title="Name your personal vault" subtitle="This is how it will appear in your app." centered />
          <View className="w-full gap-4">
            <FormField label="Vault name">
              <Controller
                control={control}
                name="vaultName"
                render={({ field: { onBlur, value } }) => (
                  <TextInput
                    autoCapitalize="words"
                    className="h-12 rounded-md border border-state-success bg-background px-4 font-sans text-base text-text"
                    onBlur={onBlur}
                    onChangeText={(text) => patchField("vaultName", text)}
                    placeholder="Your Vault"
                    placeholderTextColor={theme.colors.text.muted}
                    value={value}
                  />
                )}
              />
            </FormField>
            <View className="flex-row flex-wrap gap-2">
              {["Karuna's Vault", "My Vault", "Personal"].map((name) => (
                <SecondaryButton key={name} className="h-10 px-3" onPress={() => patchField("vaultName", name)}>
                  {name}
                </SecondaryButton>
              ))}
            </View>
          </View>
        </View>
      );
    case "first-account":
      return (
        <View className="gap-4">
          <StepIntro title="What account would you like to add first?" subtitle="You can add more accounts later." />
          <ChoiceGroup
            options={accountOptions}
            selected={values.accountKind ?? null}
            onSelect={(value) => {
              patchField("accountKind", value);
              if (!values.accountName) {
                patchField("accountName", value);
              }
            }}
            meta={{
              "Salary Account": {
                icon: "bank-outline",
                subtitle: "Track your income."
              },
              "Savings Account": {
                icon: "piggy-bank-outline",
                subtitle: "For your savings."
              },
              "Credit Card": {
                icon: "credit-card-outline",
                subtitle: "Track your card dues."
              },
              Cash: {
                icon: "wallet-outline",
                subtitle: "Track cash in hand."
              },
              Other: {
                icon: "dots-horizontal-circle-outline",
                subtitle: "Investment, loan, or another account."
              }
            }}
          />
        </View>
      );
    case "account-details":
      return (
        <View className="gap-4">
          <StepIntro title={`Tell us about your ${values.accountKind ?? "first account"}`} subtitle="You can edit these details anytime." />
          <FormField label="Account name">
            <Controller
              control={control}
              name="accountName"
              render={({ field: { onBlur, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onBlur={onBlur}
                  onChangeText={(text) => patchField("accountName", text)}
                  placeholder="Primary Bank"
                  placeholderTextColor={theme.colors.text.muted}
                  value={value}
                />
              )}
            />
          </FormField>
          <FormField label="Bank">
            <Controller
              control={control}
              name="accountBank"
              render={({ field: { onBlur, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onBlur={onBlur}
                  onChangeText={(text) => patchField("accountBank", text)}
                  placeholder="Bank or provider"
                  placeholderTextColor={theme.colors.text.muted}
                  value={value}
                />
              )}
            />
          </FormField>
          <View className="flex-row flex-wrap gap-2">
            {["HDFC Bank", "ICICI Bank", "SBI", "Cash"].map((bank) => (
              <SecondaryButton key={bank} className="h-10 px-3" onPress={() => patchField("accountBank", bank)}>
                {bank}
              </SecondaryButton>
            ))}
          </View>
          <FormField label="Opening balance (optional)">
            <Controller
              control={control}
              name="openingBalance"
              render={({ field: { onBlur, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  inputMode="decimal"
                  onBlur={onBlur}
                  onChangeText={(text) => patchField("openingBalance", text)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.muted}
                  value={value}
                />
              )}
            />
          </FormField>
        </View>
      );
    case "financial-cycle":
      return (
        <View className="gap-4">
          <StepIntro
            title="Set your monthly financial cycle"
            subtitle="We'll organize your income, expenses, and commitments around this cycle."
          />
          <ChoiceGroup
            options={cycleDays}
            selected={values.cycleStartDay ?? null}
            onSelect={(value) => patchField("cycleStartDay", value)}
            labelFor={(value) => `${value}${ordinalSuffix(value)} of every month`}
          />
          <InfoPanel icon="calendar-month-outline" title="Your first cycle" body="Money Vault will generate your first financial cycle from the selected start day." />
        </View>
      );
    case "savings-goal":
      return (
        <View className="gap-4">
          <StepIntro title="What's your savings goal this month?" subtitle="This helps you stay on track and build better habits." />
          <FormField label="Monthly savings goal">
            <Controller
              control={control}
              name="monthlySavingsGoal"
              render={({ field: { onBlur, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  inputMode="decimal"
                  onBlur={onBlur}
                  onChangeText={(text) => patchField("monthlySavingsGoal", text)}
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.text.muted}
                  value={value}
                />
              )}
            />
          </FormField>
          <InfoPanel icon="bullseye-arrow" title="Aim high, you've got this." body="You can update your goal anytime from Settings." />
          <SecondaryButton disabled={saving} onPress={() => goToNext("notifications")}>Skip</SecondaryButton>
        </View>
      );
    case "notifications":
      return (
        <View className="items-center gap-5">
          <IconHero icon="bell-ring-outline" />
          <StepIntro title="Never miss what matters" subtitle="Get reminders for bills, commitments, and important updates." centered />
          <View className="w-full gap-3">
            <FeaturePill icon="calendar-check-outline" label="Bill due dates" />
            <FeaturePill icon="clock-alert-outline" label="Obligation reminders" />
            <FeaturePill icon="chart-line" label="Spending insights" />
          </View>
          <View className="flex-row gap-3">
            <SecondaryButton className={values.notificationsEnabled === true ? "border-brand-soft" : undefined} onPress={() => patchField("notificationsEnabled", true)}>
              Allow reminders
            </SecondaryButton>
            <SecondaryButton className={values.notificationsEnabled === false ? "border-brand-soft" : undefined} onPress={() => patchField("notificationsEnabled", false)}>
              Skip
            </SecondaryButton>
          </View>
        </View>
      );
    case "finish":
      return (
        <View className="items-center gap-5">
          <IconHero icon="check-circle-outline" success />
          <StepIntro title="Your vault is ready." subtitle="Let's take you to your dashboard." centered />
          <View className="w-full gap-3">
            <FeaturePill icon="cash-multiple" label="Track income and expenses" />
            <FeaturePill icon="calendar-range" label="Plan your monthly cycle" />
            <FeaturePill icon="account-group-outline" label="Split and settle shared expenses" />
            <FeaturePill icon="bullseye-arrow" label="Reach your savings goals" />
          </View>
        </View>
      );
  }
}

function ChoiceGroup<TValue extends string | number>({
  labelFor,
  meta,
  onSelect,
  options,
  selected
}: {
  labelFor?: (value: TValue) => string;
  meta?: Partial<Record<string, { icon: IconName; subtitle: string }>>;
  onSelect: (value: TValue) => void;
  options: TValue[];
  selected: TValue | null;
}) {
  return (
    <View className="gap-3">
      {options.map((option) => {
        const key = String(option);
        const optionMeta = meta?.[key];
        const active = selected === option;

        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            className={`min-h-20 flex-row items-center rounded-lg border px-4 py-4 ${
              active ? "border-brand-soft bg-surface-raised" : "border-surface-border bg-surface"
            }`}
            onPress={() => onSelect(option)}
          >
            <View className="flex-1 flex-row items-center gap-3">
              {optionMeta ? <MaterialCommunityIcons name={optionMeta.icon} size={theme.icons.lg} color={theme.colors.brand.soft} /> : null}
              <View className="flex-1">
                <Text className="font-sans text-base font-semibold text-text">{labelFor ? labelFor(option) : key}</Text>
                {optionMeta ? <Text className="font-sans text-xs text-text-muted">{optionMeta.subtitle}</Text> : null}
              </View>
              {active ? <MaterialCommunityIcons name="check-circle" size={theme.icons.md} color={theme.colors.brand.soft} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgressDots({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${index === currentIndex ? "w-6 bg-brand" : "w-2 bg-surface-border"}`}
        />
      ))}
    </View>
  );
}

function StepIntro({ centered = false, subtitle, title }: { centered?: boolean; subtitle: string; title: string }) {
  return (
    <View className="gap-2">
      <Text className={`font-sans text-2xl font-bold text-text ${centered ? "text-center" : ""}`}>{title}</Text>
      <Text className={`font-sans text-sm text-text-muted ${centered ? "text-center" : ""}`}>{subtitle}</Text>
    </View>
  );
}

function IconBadge({ icon }: { icon: IconName }) {
  return (
    <View className="h-20 w-20 items-center justify-center rounded-full border border-brand-soft bg-brand-muted">
      <MaterialCommunityIcons name={icon} size={theme.icons.lg + 10} color={theme.colors.brand.soft} />
    </View>
  );
}

function IconHero({ icon, success = false }: { icon: IconName; success?: boolean }) {
  return (
    <View className="h-36 w-36 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-muted">
        <MaterialCommunityIcons
          name={icon}
          size={theme.icons.lg + 22}
          color={success ? theme.colors.state.success : theme.colors.brand.soft}
        />
      </View>
    </View>
  );
}

function FeaturePill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3">
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.brand.soft} />
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
    </View>
  );
}

function InfoPanel({ body, icon, title }: { body: string; icon: IconName; title: string }) {
  return (
    <View className="flex-row gap-3 rounded-lg border border-surface-border bg-surface p-4">
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.accent.gold} />
      <View className="flex-1 gap-1">
        <Text className="font-sans text-sm font-semibold text-text">{title}</Text>
        <Text className="font-sans text-xs text-text-muted">{body}</Text>
      </View>
    </View>
  );
}

function ordinalSuffix(value: number) {
  if (value === 1) {
    return "st";
  }

  return "th";
}
