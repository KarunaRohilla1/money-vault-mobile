import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { changePinSubmitError, changeVaultPin } from "@/features/settings/security/changePin";
import { changePinFormErrors, type ChangePinFormValues } from "@/features/settings/security/changePinModel";
import { SECURITY_COPY, SECURITY_MESSAGES } from "@/features/settings/security/constants/security";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function PinField({
  control,
  error,
  label,
  name
}: {
  control: ReturnType<typeof useForm<ChangePinFormValues>>["control"];
  error?: string | undefined;
  label: string;
  name: keyof ChangePinFormValues;
}) {
  return (
    <FormField error={error} label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            accessibilityLabel={label}
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Enter PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={value}
          />
        )}
      />
    </FormField>
  );
}

export function ChangePinScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setError
  } = useForm<ChangePinFormValues>({
    defaultValues: {
      confirmPin: "",
      currentPin: "",
      newPin: ""
    }
  });

  const mutation = useMutation({
    mutationFn: changeVaultPin,
    onMutate: () => {
      setSubmitError(null);
    },
    onError: (error: unknown) => {
      const mapped = changePinSubmitError(error);

      if (mapped.fieldErrors) {
        for (const [field, message] of Object.entries(mapped.fieldErrors)) {
          if (field === "currentPin" || field === "newPin" || field === "confirmPin") {
            setError(field, { message });
          }
        }
      }

      setSubmitError(mapped.message);
    },
    onSuccess: () => {
      showToast(SECURITY_MESSAGES.pinUpdated);
      goBackOrReplace(router, "/settings/security");
    }
  });

  const submit = (values: ChangePinFormValues) => {
    const fieldErrors = changePinFormErrors(values);

    if (fieldErrors.currentPin || fieldErrors.newPin || fieldErrors.confirmPin) {
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (field === "currentPin" || field === "newPin" || field === "confirmPin") {
          setError(field, { message });
        }
      }
      setSubmitError(fieldErrors.currentPin ?? fieldErrors.newPin ?? fieldErrors.confirmPin ?? null);
      return;
    }

    if (!token) {
      setSubmitError(SECURITY_MESSAGES.pinUpdateMissingSession);
      return;
    }

    mutation.mutate({
      ...values,
      token
    });
  };

  return (
    <Screen>
      <ScreenHeader description={SECURITY_COPY.changePinDescription} title={SECURITY_COPY.changePinTitle} />

      <View className="gap-4 rounded-lg border border-surface-border bg-surface p-5">
        <PinField control={control} error={errors.currentPin?.message} label="Current PIN" name="currentPin" />
        <PinField control={control} error={errors.newPin?.message} label="New PIN" name="newPin" />
        <PinField control={control} error={errors.confirmPin?.message} label="Confirm New PIN" name="confirmPin" />

        {submitError ? <Text className="font-sans text-sm text-state-danger">{submitError}</Text> : null}

        <PrimaryButton disabled={mutation.isPending} loading={mutation.isPending} onPress={handleSubmit(submit)}>
          Save PIN
        </PrimaryButton>
        <SecondaryButton disabled={mutation.isPending} onPress={() => goBackOrReplace(router, "/settings/security")}>
          Cancel
        </SecondaryButton>
      </View>
    </Screen>
  );
}
