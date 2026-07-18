import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ApiClientError } from "@/services/api/client";
import { LoginFlowError, loginWithVaultCredentials, restoreBackendSession } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const loginSchema = z.object({
  pin: z.string().min(1, "PIN is required."),
  vaultName: z.string().min(1, "Vault name is required.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getSafeLoginError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiClientError && error.status === 401) {
    return {
      code: error.code ?? "INVALID_CREDENTIALS",
      message: "Invalid vault credentials."
    };
  }

  if (error instanceof ApiClientError) {
    if (error.code === "LOGIN_RESPONSE_INVALID") {
      return {
        code: error.code,
        message: "Login succeeded, but the app could not read the session response."
      };
    }

    return {
      code: error.code ?? (error.status ? `HTTP_${error.status}` : "API_CLIENT_ERROR"),
      message: "Money Vault API is unavailable. Try again."
    };
  }

  if (error instanceof LoginFlowError) {
    return {
      code: error.code,
      message: "Login succeeded, but the app could not save the session."
    };
  }

  return {
    code: "LOGIN_FLOW_ERROR",
    message: "Login could not be completed. Try again."
  };
}

export default function SignInRoute() {
  const params = useLocalSearchParams<{ vaultName?: string }>();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setError = useAuthStore((state) => state.setError);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setError: setFormError,
    setValue
  } = useForm<LoginFormValues>({
    defaultValues: {
      pin: "",
      vaultName: typeof params.vaultName === "string" ? params.vaultName : ""
    }
  });

  useEffect(() => {
    if (typeof params.vaultName === "string") {
      setValue("vaultName", params.vaultName);
    }
  }, [params.vaultName, setValue]);

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => loginWithVaultCredentials(values),
    onMutate: () => {
      setError(null);
    },
    onError: (error: unknown) => {
      const safeError = getSafeLoginError(error);
      setError(__DEV__ ? `${safeError.message} (${safeError.code})` : safeError.message);
    },
    onSuccess: async (response) => {
      try {
        setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault);
      } catch (error) {
        const safeError = getSafeLoginError(
          new LoginFlowError("Unable to update authentication state.", {
            cause: error,
            code: "AUTH_STORE_UPDATE_FAILED",
            stage: "AUTH_STORE_UPDATED"
          })
        );
        setError(__DEV__ ? `${safeError.message} (${safeError.code})` : safeError.message);
      }
    }
  });

  const authError = useAuthStore((state) => state.errorMessage);
  const restoreMutation = useMutation({
    mutationFn: restoreBackendSession,
    onMutate: () => {
      setError(null);
    },
    onError: () => {
      setError("Unable to restore backend session. Check your connection and try again.");
    },
    onSuccess: (session) => {
      if (session) {
        setAuthenticated(session.token, session.vault, session.authenticatedVault);
      }
    }
  });
  const canRetryRestore = authError?.startsWith("Unable to restore backend session") ?? false;
  const submitLogin = (values: LoginFormValues) => {
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "pin" || field === "vaultName") {
          setFormError(field, { message: issue.message });
        }
      }
      return;
    }

    loginMutation.mutate(parsed.data);
  };

  return (
    <Screen contentClassName="flex-1 justify-center gap-6" scroll={false}>
      <View className="gap-2">
        <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
        <Text className="font-sans text-2xl font-bold text-text">Unlock your vault</Text>
        <Text className="font-sans text-sm text-text-muted">Use your existing vault name and PIN.</Text>
      </View>

      <View className="gap-4 rounded-lg border border-surface-border bg-surface p-5">
        <View className="gap-2">
          <Text className="font-sans text-sm font-semibold text-text">Vault name</Text>
          <Controller
            control={control}
            name="vaultName"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                autoCapitalize="words"
                className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter vault name"
                placeholderTextColor={theme.colors.text.subtle}
                value={value}
              />
            )}
          />
          {errors.vaultName ? <Text className="font-sans text-xs text-state-danger">{errors.vaultName.message}</Text> : null}
        </View>

        <View className="gap-2">
          <Text className="font-sans text-sm font-semibold text-text">PIN</Text>
          <Controller
            control={control}
            name="pin"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter PIN"
                placeholderTextColor={theme.colors.text.subtle}
                secureTextEntry
                value={value}
              />
            )}
          />
          {errors.pin ? <Text className="font-sans text-xs text-state-danger">{errors.pin.message}</Text> : null}
        </View>

        {authError ? <Text className="font-sans text-sm text-state-danger">{authError}</Text> : null}
        {canRetryRestore ? (
          <SecondaryButton disabled={restoreMutation.isPending} onPress={() => restoreMutation.mutate()}>
            Retry session
          </SecondaryButton>
        ) : null}

        <PrimaryButton loading={loginMutation.isPending} disabled={loginMutation.isPending} onPress={handleSubmit(submitLogin)}>
          Unlock
        </PrimaryButton>
      </View>
    </Screen>
  );
}
