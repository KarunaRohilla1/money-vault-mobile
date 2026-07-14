import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton } from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import { ApiClientError } from "@/services/api/client";
import { loginWithVaultCredentials } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const loginSchema = z.object({
  pin: z.string().min(1, "PIN is required."),
  vaultName: z.string().min(1, "Vault name is required.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInRoute() {
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setError = useAuthStore((state) => state.setError);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setError: setFormError
  } = useForm<LoginFormValues>({
    defaultValues: {
      pin: "",
      vaultName: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => loginWithVaultCredentials(values),
    onMutate: () => {
      setError(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiClientError && error.status === 401) {
        setError("Invalid vault credentials.");
        return;
      }

      setError("Money Vault API is unavailable. Try again.");
    },
    onSuccess: async (response) => {
      setAuthenticated(response.token, response.vault);
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.root });
    }
  });

  const authError = useAuthStore((state) => state.errorMessage);
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

        <PrimaryButton loading={loginMutation.isPending} disabled={loginMutation.isPending} onPress={handleSubmit(submitLogin)}>
          Unlock
        </PrimaryButton>
      </View>
    </Screen>
  );
}
