import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import {
  useCreateTransactionMutation,
  useTransactionDetailQuery,
  useUpdateTransactionMutation
} from "@/features/transactions/api";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const transactionSchema = z.object({
  accountId: z.number().int().positive("Choose an account."),
  amount: z.string().refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  categoryId: z.number().int().positive("Choose a category."),
  date: z.string().min(1, "Date is required."),
  notes: z.string(),
  transactionType: z.enum(["Expense", "Income"])
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

interface TransactionFormScreenProps {
  transactionId?: number | null;
}

export function TransactionFormScreen({ transactionId = null }: TransactionFormScreenProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const transactionQuery = useTransactionDetailQuery(token, vaultId, transactionId);
  const createTransaction = useCreateTransactionMutation(token, vaultId);
  const updateTransaction = useUpdateTransactionMutation(token, vaultId);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue
  } = useForm<TransactionFormValues>({
    defaultValues: {
      accountId: 0,
      amount: "",
      categoryId: 0,
      date: todayIso(),
      notes: "",
      transactionType: "Expense"
    }
  });
  const selectedAccountId = useWatch({ control, name: "accountId" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const selectedType = useWatch({ control, name: "transactionType" });
  const categoryOptions = (categoriesQuery.data ?? []).filter((category) =>
    selectedType === "Income" ? category.categoryType === "Income" : category.categoryType !== "Income"
  );
  const isEditing = transactionId !== null;
  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  useEffect(() => {
    if (!transactionQuery.data) {
      return;
    }

    reset({
      accountId: transactionQuery.data.accountId,
      amount: String(transactionQuery.data.amount),
      categoryId: transactionQuery.data.categoryId,
      date: transactionQuery.data.date,
      notes: transactionQuery.data.notes ?? "",
      transactionType: transactionQuery.data.transactionType === "Income" ? "Income" : "Expense"
    });
  }, [reset, transactionQuery.data]);

  const submit = (values: TransactionFormValues) => {
    const parsed = transactionSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "accountId" || field === "amount" || field === "categoryId" || field === "date") {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    const body = {
        accountId: parsed.data.accountId,
        amount: Number(parsed.data.amount),
        categoryId: parsed.data.categoryId,
        date: parsed.data.date,
        notes: parsed.data.notes,
        transactionType: parsed.data.transactionType
    };

    if (transactionId) {
      updateTransaction.mutate(
        {
          body,
          transactionId
        },
        {
          onSuccess: () => router.back()
        }
      );
      return;
    }

    createTransaction.mutate(
      body,
      {
        onSuccess: () => router.back()
      }
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title={isEditing ? "Edit transaction" : "Add transaction"}
        description={isEditing ? "Update an income or expense in the current vault." : "Create an income or expense in the current vault."}
      />

      {accountsQuery.isLoading || categoriesQuery.isLoading || transactionQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {accountsQuery.isError || categoriesQuery.isError || transactionQuery.isError ? (
        <ErrorView
          message="Form data could not be loaded."
          onRetry={() => {
            accountsQuery.refetch();
            categoriesQuery.refetch();
            transactionQuery.refetch();
          }}
        />
      ) : null}

      <View className="gap-5 rounded-lg border border-surface-border bg-surface p-4">
        <View className="flex-row gap-2">
          {(["Expense", "Income"] as const).map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              className={`h-11 flex-1 items-center justify-center rounded-md border ${
                selectedType === type ? "border-brand bg-brand-deep" : "border-surface-border bg-background-muted"
              }`}
              onPress={() => {
                setValue("transactionType", type);
                setValue("categoryId", 0);
              }}
            >
              <Text className="font-sans text-sm font-semibold text-text">{type}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="Amount" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
                keyboardType="decimal-pad"
                onChangeText={onChange}
                placeholder="0"
                placeholderTextColor={theme.colors.text.subtle}
                value={value}
              />
            )}
          />
        </Field>

        <Field label="Date" error={errors.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.subtle}
                value={value}
              />
            )}
          />
        </Field>

        <ChoiceGroup
          error={errors.accountId?.message}
          label="Account"
          options={(accountsQuery.data ?? []).map((account) => ({ id: account.id, label: account.name }))}
          selectedId={selectedAccountId}
          onSelect={(id) => setValue("accountId", id, { shouldValidate: true })}
        />
        <ChoiceGroup
          error={errors.categoryId?.message}
          label="Category"
          options={categoryOptions.map((category) => ({ id: category.id, label: `${category.emoji} ${category.name}` }))}
          selectedId={selectedCategoryId}
          onSelect={(id) => setValue("categoryId", id, { shouldValidate: true })}
        />

        <Field label="Notes">
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="min-h-20 rounded-md border border-surface-border bg-background-muted px-4 py-3 font-sans text-base text-text"
                multiline
                onChangeText={onChange}
                placeholder="Optional"
                placeholderTextColor={theme.colors.text.subtle}
                value={value}
              />
            )}
          />
        </Field>

        {createTransaction.isError || updateTransaction.isError ? (
          <Text className="font-sans text-sm text-state-danger">Transaction could not be saved.</Text>
        ) : null}
        <PrimaryButton loading={isSaving} disabled={isSaving} onPress={handleSubmit(submit)}>
          {isEditing ? "Save transaction" : "Add transaction"}
        </PrimaryButton>
        <SecondaryButton onPress={() => router.back()}>Cancel</SecondaryButton>
      </View>
    </Screen>
  );
}

interface FieldProps {
  children: ReactNode;
  error?: string | undefined;
  label: string;
}

function Field({ children, error, label }: FieldProps) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
      {children}
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

interface ChoiceGroupProps {
  error?: string | undefined;
  label: string;
  onSelect: (id: number) => void;
  options: { id: number; label: string }[];
  selectedId: number;
}

function ChoiceGroup({ error, label, onSelect, options, selectedId }: ChoiceGroupProps) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            className={`rounded-md border px-3 py-2 ${
              selectedId === option.id ? "border-brand bg-brand-deep" : "border-surface-border bg-background-muted"
            }`}
            onPress={() => onSelect(option.id)}
          >
            <Text className="font-sans text-sm text-text">{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}
