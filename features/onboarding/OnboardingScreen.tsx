import { Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { useOnboardingFlow, type OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { AccountDetailsStep } from "@/features/onboarding/steps/AccountDetailsStep";
import { AccountTypeStep } from "@/features/onboarding/steps/AccountTypeStep";
import { FinancialCycleStep } from "@/features/onboarding/steps/FinancialCycleStep";
import { FinishStep } from "@/features/onboarding/steps/FinishStep";
import { SavingsGoalStep } from "@/features/onboarding/steps/SavingsGoalStep";
import { ProgressDots } from "@/features/onboarding/steps/stepUi";
import { VaultNameStep } from "@/features/onboarding/steps/VaultNameStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/stores/onboardingStore";

export function OnboardingScreen() {
  const flow = useOnboardingFlow();

  return (
    <Screen contentClassName="min-h-full flex-1">
      <ScreenHeader title={flow.screenTitle} description={`Step ${flow.stepIndex + 1} of ${ONBOARDING_STEPS.length}`} />
      <View className="flex-1 justify-between gap-5 rounded-lg border border-surface-border bg-background-muted p-5">
        <ProgressDots currentIndex={flow.stepIndex} total={ONBOARDING_STEPS.length} />
        <View className="flex-1 justify-center">{renderStep(flow.step, flow)}</View>
        <View className="gap-4">
          {flow.stepError ? <Text className="font-sans text-sm text-state-danger">{flow.stepError}</Text> : null}
          <View className="flex-row gap-3">
            {flow.step !== "welcome" ? (
              <SecondaryButton disabled={flow.saving} onPress={flow.goBack}>
                Back
              </SecondaryButton>
            ) : null}
            {flow.step !== "finish" ? (
              <PrimaryButton loading={flow.saving} disabled={flow.saving} onPress={() => flow.goToNext()}>
                Continue
              </PrimaryButton>
            ) : (
              <PrimaryButton loading={flow.saving} disabled={flow.saving} onPress={flow.finish}>
                Go to Dashboard
              </PrimaryButton>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function renderStep(step: OnboardingStep, props: OnboardingStepProps) {
  switch (step) {
    case "welcome":
      return <WelcomeStep />;
    case "vault-name":
      return <VaultNameStep {...props} />;
    case "first-account":
      return <AccountTypeStep {...props} />;
    case "account-details":
      return <AccountDetailsStep {...props} />;
    case "financial-cycle":
      return <FinancialCycleStep {...props} />;
    case "savings-goal":
      return <SavingsGoalStep {...props} />;
    case "finish":
      return <FinishStep />;
  }
}
