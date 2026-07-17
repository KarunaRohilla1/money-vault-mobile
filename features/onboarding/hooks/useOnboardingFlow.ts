import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler } from "react-native";
import { type Control, useForm, useWatch } from "react-hook-form";

import { validationMessage } from "@/features/onboarding/onboardingSchema";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  ensurePersonalVault,
  generateFirstFinancialCycle,
  markOnboardingComplete,
  OnboardingApiNotImplementedError,
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
  type OnboardingDraft,
  type OnboardingStep,
  useOnboardingStore
} from "@/stores/onboardingStore";

export interface OnboardingStepProps {
  control: Control<OnboardingDraft>;
  goToNext: (targetStep?: OnboardingStep) => Promise<void>;
  patchField: <TKey extends keyof OnboardingDraft>(field: TKey, value: OnboardingDraft[TKey]) => void;
  saving: boolean;
  values: Partial<OnboardingDraft>;
}

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

function safePersistenceMessage(error: unknown) {
  if (error instanceof OnboardingApiNotImplementedError) {
    return error.message;
  }

  return "This onboarding step could not be saved. Try again.";
}

export function useOnboardingFlow() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const completeVault = useOnboardingStore((state) => state.completeVault);
  const setStep = useOnboardingStore((state) => state.setStep);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const persistedVaultState = useOnboardingStore((state) => (vaultId ? state.vaults[vaultId] : undefined));
  const persisted = persistedVaultState ?? getVaultOnboardingState(vaultId);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const step = persisted.step;
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const { control, getValues, setValue } = useForm<OnboardingDraft>({
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
    if (!vaultId || getValues("vaultName")) {
      return;
    }

    const fallbackName = defaultVaultName(vault?.name);
    setValue("vaultName", fallbackName);
    updateDraft(vaultId, { vaultName: fallbackName });
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

  const goToNext = async (targetStep?: OnboardingStep) => {
    if (!vaultId || !token) {
      return;
    }

    setStepError(null);
    const current = getValues();
    const message = validationMessage(step, current);

    if (message) {
      setStepError(message);
      return;
    }

    setSaving(true);
    try {
      await persistStep(token, vaultId, step, current);
      setStep(vaultId, targetStep ?? nextStep(step));
    } catch (error) {
      setStepError(safePersistenceMessage(error));
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.effective(vaultId) });
      router.replace("/" as never);
    } catch (error) {
      setStepError(safePersistenceMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return {
    control,
    finish,
    goBack,
    goToNext,
    patchField,
    saving,
    screenTitle,
    step,
    stepError,
    stepIndex,
    values
  };
}
