import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import {
  buildTransactionPrefill,
  parseTransactionMessage,
  type ParsedTransactionMessage,
  type TransactionPrefillValues
} from "@/features/transactions/parser/transactionMessageParser";
import {
  useCreateTransactionMutation,
  useTransactionDetailQuery,
  useUpdateTransactionMutation
} from "@/features/transactions/api";
import { readClipboardText } from "@/services/clipboard";
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
  const [pasteVisible, setPasteVisible] = useState(false);
  const [pasteMessage, setPasteMessage] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [parsedMessage, setParsedMessage] = useState<ParsedTransactionMessage | null>(null);
  const [pendingPrefill, setPendingPrefill] = useState<TransactionPrefillValues | null>(null);
  const [confirmReplaceVisible, setConfirmReplaceVisible] = useState(false);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const transactionQuery = useTransactionDetailQuery(token, vaultId, transactionId);
  const createTransaction = useCreateTransactionMutation(token, vaultId);
  const updateTransaction = useUpdateTransactionMutation(token, vaultId);
  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
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
  const currentNotes = useWatch({ control, name: "notes" });
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

  const closePasteSheet = () => {
    setPasteVisible(false);
    setPasteMessage("");
    setPasteError(null);
    setParsedMessage(null);
    setPendingPrefill(null);
  };

  const parseMessage = () => {
    const message = pasteMessage.trim();
    if (!message) {
      setPasteError("Paste or type a transaction message first.");
      setParsedMessage(null);
      return;
    }

    if (message.length > 5000) {
      setPasteError("This message is too long to parse safely.");
      setParsedMessage(null);
      return;
    }

    const parsed = parseTransactionMessage(message);
    setParsedMessage(parsed);
    setPendingPrefill(buildTransactionPrefill(parsed, accountsQuery.data ?? [], categoriesQuery.data ?? [], currentNotes));
    setPasteError(null);
  };

  const pasteFromClipboard = async () => {
    const result = await readClipboardText();
    if (result.errorCode === "CLIPBOARD_EMPTY") {
      setPasteError("Clipboard is empty.");
      return;
    }
    if (result.errorCode === "CLIPBOARD_UNAVAILABLE") {
      setPasteError("Clipboard is not available in this build. You can still paste manually.");
      return;
    }
    setPasteMessage(result.text);
    setPasteError(null);
  };

  const formHasEnteredValues = () => {
    const values = getValues();
    return values.accountId > 0 || values.amount.trim().length > 0 || values.categoryId > 0 || values.notes.trim().length > 0;
  };

  const requestUseDetails = () => {
    if (!pendingPrefill) {
      return;
    }

    if (formHasEnteredValues()) {
      setConfirmReplaceVisible(true);
      return;
    }

    applyPrefill(pendingPrefill);
  };

  const applyPrefill = (prefill: TransactionPrefillValues) => {
    if (prefill.transactionType !== undefined) {
      setValue("transactionType", prefill.transactionType, { shouldValidate: true });
      if (prefill.categoryId === undefined) {
        setValue("categoryId", 0, { shouldValidate: true });
      }
    }
    if (prefill.accountId !== undefined) {
      setValue("accountId", prefill.accountId, { shouldValidate: true });
    }
    if (prefill.amount !== undefined) {
      setValue("amount", prefill.amount, { shouldValidate: true });
    }
    if (prefill.categoryId !== undefined) {
      setValue("categoryId", prefill.categoryId, { shouldValidate: true });
    }
    if (prefill.date !== undefined) {
      setValue("date", prefill.date, { shouldValidate: true });
    }
    if (prefill.notes !== undefined) {
      setValue("notes", prefill.notes, { shouldValidate: true });
    }
    closePasteSheet();
    setConfirmReplaceVisible(false);
  };

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
        {!isEditing ? (
          <Pressable
            accessibilityRole="button"
            className="rounded-lg border border-brand/70 bg-brand-deep px-4 py-3"
            onPress={() => setPasteVisible(true)}
          >
            <Text className="font-sans text-base font-semibold text-text">Paste Message</Text>
            <Text className="mt-1 font-sans text-sm text-text-muted">Parse a bank SMS or email, then review before filling this form.</Text>
          </Pressable>
        ) : null}

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

      <BottomSheet visible={pasteVisible} title="Paste Message" onClose={closePasteSheet}>
        <View className="gap-4">
          <Text className="font-sans text-sm text-text-muted">
            Paste a bank SMS or email. Parsing happens only on this device and nothing is submitted until you save the transaction.
          </Text>
          <TextInput
            className="min-h-40 rounded-md border border-surface-border bg-background-muted px-4 py-3 font-sans text-base text-text"
            multiline
            onChangeText={(value) => {
              setPasteMessage(value);
              setParsedMessage(null);
              setPendingPrefill(null);
              setPasteError(null);
            }}
            placeholder="Paste transaction message"
            placeholderTextColor={theme.colors.text.subtle}
            textAlignVertical="top"
            value={pasteMessage}
          />
          {pasteError ? <Text className="font-sans text-sm text-state-danger">{pasteError}</Text> : null}
          <View className="flex-row gap-3">
            <SecondaryButton onPress={pasteFromClipboard}>Paste from Clipboard</SecondaryButton>
            <PrimaryButton onPress={parseMessage}>Parse</PrimaryButton>
          </View>

          {parsedMessage && pendingPrefill ? (
            <View className="gap-3 rounded-lg border border-surface-border bg-background-muted p-4">
              <Text className="font-sans text-base font-semibold text-text">Detected Details</Text>
              <DetectedRow label="Type" value={parsedMessage.type === "unknown" ? "Not detected" : parsedMessage.type} />
              <DetectedRow label="Amount" value={parsedMessage.amount === null ? "Not detected" : pendingPrefill.amount ?? "Not detected"} />
              <DetectedRow label="Date" value={parsedMessage.date ?? "Not detected"} />
              <DetectedRow label="Account" value={describeAccount(pendingPrefill.accountId, accountsQuery.data ?? [])} />
              <DetectedRow label="Category" value={describeCategory(pendingPrefill.categoryId, categoriesQuery.data ?? [])} />
              <DetectedRow label="Merchant" value={parsedMessage.merchant ?? "Not detected"} />
              <DetectedRow label="Reference" value={parsedMessage.reference ?? "Not detected"} />
              {pendingPrefill.warnings.length > 0 ? (
                <Text className="font-sans text-xs text-text-muted">Review: {pendingPrefill.warnings.map(formatParserWarning).join(", ")}</Text>
              ) : null}
              <PrimaryButton onPress={requestUseDetails}>Use Details</PrimaryButton>
            </View>
          ) : null}
        </View>
      </BottomSheet>

      <BottomSheet visible={confirmReplaceVisible} title="Replace form details?" onClose={() => setConfirmReplaceVisible(false)}>
        <View className="gap-4">
          <Text className="font-sans text-sm text-text-muted">Using parsed details will replace fields you have already entered in this form.</Text>
          <PrimaryButton onPress={() => (pendingPrefill ? applyPrefill(pendingPrefill) : undefined)}>Replace Details</PrimaryButton>
          <SecondaryButton onPress={() => setConfirmReplaceVisible(false)}>Keep Editing</SecondaryButton>
        </View>
      </BottomSheet>
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

function DetectedRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <Text className="shrink font-sans text-sm font-semibold capitalize text-text">{value}</Text>
    </View>
  );
}

function describeAccount(accountId: number | undefined, accounts: { id: number; name: string }[]) {
  if (accountId === undefined) {
    return "Not matched";
  }
  return accounts.find((account) => account.id === accountId)?.name ?? "Matched";
}

function describeCategory(categoryId: number | undefined, categories: { id: number; name: string }[]) {
  if (categoryId === undefined) {
    return "Not matched";
  }
  return categories.find((category) => category.id === categoryId)?.name ?? "Matched";
}

function formatParserWarning(warning: string) {
  return warning.replace(/-/g, " ");
}
