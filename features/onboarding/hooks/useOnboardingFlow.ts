import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler } from "react-native";
import { type Control, useForm, useWatch } from "react-hook-form";

import { validationMessage } from "@/features/onboarding/onboardingSchema";
import { useSettingsQuery } from "@/features/settings/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  ensurePersonalVault,
  generateFirstFinancialCycle,
  markOnboardingComplete,
  OnboardingApiNotImplementedError,
  saveFirstAccount,
  saveMonthlySavingsGoal
} from "@/services/api/onboarding";
import { useAccessStore } from "@/stores/accessStore";
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

async function persistStep(token: string, vaultId: string, step: OnboardingStep, values: OnboardingDraft) {
  switch (step) {
    case "welcome":
      await ensurePersonalVault(token, useAuthStore.getState().vault);
      return;
    case "account-details":
      await saveFirstAccount(token, vaultId, values);
      return;
    case "financial-cycle":
      return generateFirstFinancialCycle(token, vaultId, values.cycleStartDay ?? 1);
    case "savings-goal":
      await saveMonthlySavingsGoal(token, vaultId, values.monthlySavingsGoal.trim());
      return;
    case "biometric-prompt":
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
  const settingsQuery = useSettingsQuery(token, vaultId);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const step = ONBOARDING_STEPS.includes(persisted.step) ? persisted.step : "welcome";
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const { control, getValues, setValue } = useForm<OnboardingDraft>({
    defaultValues: {
      ...EMPTY_ONBOARDING_DRAFT,
      ...persisted.draft
    }
  });
  const values = useWatch({ control });

  useEffect(() => {
    const savedCycleStartDay = settingsQuery.data?.cycleStartDay;

    if (!vaultId || !savedCycleStartDay || persisted.draft.cycleStartDay !== null) {
      return;
    }

    setValue("cycleStartDay", savedCycleStartDay);
    updateDraft(vaultId, { cycleStartDay: savedCycleStartDay });
  }, [persisted.draft.cycleStartDay, setValue, settingsQuery.data?.cycleStartDay, updateDraft, vaultId]);
  const screenTitle = useMemo(() => {
    switch (step) {
      case "welcome":
        return "Welcome";
      case "biometric-prompt":
        return "Fingerprint unlock";
      case "first-account":
        return "First account";
      case "account-details":
        return "Account details";
      case "financial-cycle":
        return "Financial cycle";
      case "savings-goal":
        return "Savings goal";
      case "finish":
        return "Ready";
    }
  }, [step]);

  useEffect(() => {
    if (!vaultId || getValues("vaultName")) {
      return;
    }

    setValue("vaultName", "Personal");
    updateDraft(vaultId, { vaultName: "Personal" });
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
      const saved = await persistStep(token, vaultId, step, current);
      if (step === "financial-cycle" && saved && typeof saved === "object" && "cycleStartDay" in saved) {
        const cycleStartDay = saved.cycleStartDay;
        if (typeof cycleStartDay === "number") {
          updateDraft(vaultId, { cycleStartDay });
          queryClient.setQueryData(queryKeys.settings.effective(vaultId), saved);
        }
      }
      setStep(vaultId, targetStep ?? nextStep(step));
    } catch (error) {
      setStepError(safePersistenceMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const enableFingerprintThenContinue = async () => {
    setStepError(null);
    setSaving(true);
    try {
      const { authenticateWithBiometrics, isBiometricSupported } = await import(
        "@/features/settings/security/services/biometric.service"
      );
      const { setSecureItem } = await import("@/features/settings/security/services/secureStorage.service");
      const { SECURITY_STORAGE_KEYS } = await import("@/features/settings/security/constants/security");

      const supported = await isBiometricSupported();
      if (!supported) {
        setStepError("Fingerprint isn't available on this device. You can enable it later in Settings.");
        return;
      }

      const result = await authenticateWithBiometrics("Enable fingerprint unlock");
      if (result.status === "cancelled") {
        return;
      }
      if (result.status !== "success") {
        setStepError(result.message ?? "Fingerprint could not be enabled.");
        return;
      }

      await setSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled, "true");
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId) {
        await setSecureItem(SECURITY_STORAGE_KEYS.biometricUserId, currentUserId);
      }
      await goToNext();
    } catch {
      setStepError("Fingerprint could not be enabled. Try again or choose Not now.");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    const personalVaultId =
      useAuthStore.getState().authenticatedVault?.id ?? useAuthStore.getState().vault?.id ?? vaultId;
    if (!personalVaultId || !token) {
      return;
    }

    setSaving(true);
    setStepError(null);
    try {
      await markOnboardingComplete(token, personalVaultId);
      // Persist local completion under the same vault id AccessGate/bootstrap use.
      completeVault(personalVaultId);
      if (vaultId && vaultId !== personalVaultId) {
        completeVault(vaultId);
      }
      // Mark access ready immediately so AccessGate does not bounce "/" back to /onboarding
      // while the dashboard setup checklist is still catching up.
      useAccessStore.getState().setAccessState("ready");
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(personalVaultId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.effective(personalVaultId) });
      router.replace("/" as never);
    } catch (error) {
      setStepError(safePersistenceMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return {
    control,
    enableFingerprintThenContinue,
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
