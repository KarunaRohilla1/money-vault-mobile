import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, ErrorView, LoadingSkeleton, PrimaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import { useSettingsQuery } from "@/features/settings/api";
import { useSharedExpensesQuery } from "@/features/shared/api";
import { MonthDatePicker } from "@/features/transfers/TransfersScreen";
import { useCreateTransactionMutation, useTransactionDetailQuery, useUpdateTransactionMutation } from "@/features/transactions/api";
import {
  ALLOCATION_EQUAL,
  ALLOCATION_FIXED,
  ALLOCATION_PERCENTAGE,
  amountError,
  buildTransactionPayload,
  defaultSplitValues,
  hasTransactionFormErrors,
  rebalanceTwoParticipantAmounts,
  rebalanceTwoParticipantPercentages,
  splitPreview,
  type SplitPreviewItem,
  transactionFormErrors,
  type ExpenseScope,
  type SplitParticipant,
  type SplitType,
  type TransactionFormErrorMap,
  type TransactionFormValues,
  type TransactionKind
} from "@/features/transactions/transactionFormModel";
import { formatIsoDateOnly, todayLocalIso } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import type { AccountApi, VaultSummaryApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

const transactionSchema = z.object({
  accountId: z.number().int(),
  allocationAmounts: z.record(z.string(), z.string()),
  allocationPercentages: z.record(z.string(), z.string()),
  amount: z.string(),
  categoryId: z.number().int(),
  date: z.string(),
  expenseScope: z.enum(["Personal", "Shared"]),
  notes: z.string(),
  sharedVaultId: z.number().int(),
  splitType: z.enum([ALLOCATION_EQUAL, ALLOCATION_PERCENTAGE, ALLOCATION_FIXED]),
  transactionType: z.enum(["Expense", "Income"])
});

type SelectorTarget = "account" | "category" | "sharedVault" | null;

interface TransactionFormScreenProps {
  transactionId?: number | null;
}

export function TransactionFormScreen({ transactionId = null }: TransactionFormScreenProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const authenticatedVault = useAuthStore((state) => state.authenticatedVault);
  const vaultId = vault?.id ?? null;
  const isSharedVault = vault?.vaultType === "Shared";
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const settingsQuery = useSettingsQuery(token, vaultId);
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(todayLocalIso());
  const [submittedErrors, setSubmittedErrors] = useState<TransactionFormErrorMap>({});
  const isEditing = transactionId !== null;
  const transactionDetailQuery = useTransactionDetailQuery(token, vaultId, transactionId);
  const createTransaction = useCreateTransactionMutation(token, vaultId);
  const updateTransaction = useUpdateTransactionMutation(token, vaultId);
  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  const { control, handleSubmit, reset, setValue } = useForm<TransactionFormValues>({
    defaultValues: {
      accountId: 0,
      allocationAmounts: {},
      allocationPercentages: {},
      amount: "",
      categoryId: 0,
      date: todayLocalIso(),
      expenseScope: isSharedVault ? "Shared" : "Personal",
      notes: "",
      sharedVaultId: isSharedVault ? Number(vaultId) : 0,
      splitType: ALLOCATION_EQUAL,
      transactionType: "Expense"
    }
  });

  const values = useWatch({ control });
  const formValues = transactionSchema.parse(values);
  const selectedAmount = formValues.amount;
  const selectedType = formValues.transactionType;
  const selectedScope = formValues.expenseScope;
  const selectedSharedVaultId = formValues.sharedVaultId;
  const selectedSplitType = formValues.splitType;
  const parsedAmount = amountError(selectedAmount) ? 0 : Number(selectedAmount.replace(/,/g, "").trim());
  const sharedVaultQueryId = isSharedVault ? null : selectedSharedVaultId > 0 ? selectedSharedVaultId : null;
  const sharedExpensesQuery = useSharedExpensesQuery(
    token,
    vaultId,
    selectedType === "Expense" && selectedScope === "Shared" ? sharedVaultQueryId : null
  );

  const sharedVaults = (settingsQuery.data?.accessibleVaults ?? []).filter((item) => item.vaultType === "Shared");
  const selectedSharedVault = isSharedVault
    ? ({ id: Number(vaultId ?? 0), name: vault?.name ?? "Shared Vault", vaultType: "Shared", isAdmin: Boolean(vault?.isAdmin) } satisfies VaultSummaryApi)
    : sharedVaults.find((item) => item.id === selectedSharedVaultId) ?? null;
  const categoryOptions = (categoriesQuery.data ?? []).filter((category) => {
    if (selectedType === "Income") {
      return category.categoryType === "Income";
    }

    if (selectedType === "Expense" && selectedScope === "Shared") {
      return category.categoryType !== "Income" && category.isSystem;
    }

    return category.categoryType !== "Income";
  });
  const currentParticipantId = Number(authenticatedVault?.id ?? vaultId ?? 0);
  const participants: SplitParticipant[] = (sharedExpensesQuery.data?.data.participants ?? []).map((row) => ({
    id: row[0],
    isCurrent: row[0] === currentParticipantId,
    name: row[1]
  }));
  const participantIdSignature = participants.map((participant) => String(participant.id)).join("|");
  const allocationAmountSignature = Object.keys(formValues.allocationAmounts).sort().join("|");
  const allocationPercentageSignature = Object.keys(formValues.allocationPercentages).sort().join("|");
  const previewItems = splitPreview(parsedAmount, selectedSplitType, participants, formValues);
  const visibleErrors = { ...submittedErrors };
  const selectedAccount = (accountsQuery.data ?? []).find((account) => account.id === formValues.accountId) ?? null;
  const selectedCategory = categoryOptions.find((category) => category.id === formValues.categoryId) ?? null;
  const normalizedCategorySearch = categorySearch.trim().toLocaleLowerCase();
  const visibleCategoryOptions = normalizedCategorySearch
    ? categoryOptions.filter((category) =>
        [category.name, category.parentCategory ?? "", category.categoryType, category.emoji]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedCategorySearch)
      )
    : categoryOptions;
  const isSharedExpense = selectedType === "Expense" && selectedScope === "Shared";
  const clearSubmittedError = (field: keyof TransactionFormErrorMap) => {
    setSubmittedErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (!isEditing || !transactionDetailQuery.data) {
      return;
    }

    const detail = transactionDetailQuery.data;
    reset({
      accountId: detail.accountId,
      allocationAmounts: {},
      allocationPercentages: {},
      amount: String(detail.amount),
      categoryId: detail.categoryId,
      date: detail.date,
      expenseScope: detail.shared ? "Shared" : "Personal",
      notes: detail.notes ?? "",
      sharedVaultId: detail.beneficiaryVaultId ?? 0,
      splitType: detail.allocationMethod === ALLOCATION_PERCENTAGE || detail.allocationMethod === ALLOCATION_FIXED ? detail.allocationMethod : ALLOCATION_EQUAL,
      transactionType: detail.transactionType === "Income" ? "Income" : "Expense"
    });
  }, [isEditing, reset, transactionDetailQuery.data]);

  useEffect(() => {
    if (isSharedVault) {
      setValue("expenseScope", "Shared");
      setValue("sharedVaultId", Number(vaultId ?? 0));
    }
  }, [isSharedVault, setValue, vaultId]);

  useEffect(() => {
    if (!isSharedVault && selectedScope === "Shared" && selectedSharedVaultId === 0 && sharedVaults[0]) {
      setValue("sharedVaultId", sharedVaults[0].id);
    }
  }, [isSharedVault, selectedScope, selectedSharedVaultId, setValue, sharedVaults]);

  useEffect(() => {
    if (!isSharedExpense) {
      return;
    }

    const splitParticipants = participantIdSignature
      .split("|")
      .filter(Boolean)
      .map((id) => ({ id: Number(id), name: "" }));
    const hasMissingDefaults = splitParticipants.some(
      (participant) =>
        !(String(participant.id) in formValues.allocationAmounts) || !(String(participant.id) in formValues.allocationPercentages)
    );

    if (!hasMissingDefaults) {
      return;
    }

    const defaults = defaultSplitValues(splitParticipants, parsedAmount);
    setValue("allocationAmounts", defaults.allocationAmounts);
    setValue("allocationPercentages", defaults.allocationPercentages);
  }, [
    allocationAmountSignature,
    allocationPercentageSignature,
    formValues.allocationAmounts,
    formValues.allocationPercentages,
    isSharedExpense,
    parsedAmount,
    participantIdSignature,
    setValue
  ]);

  if (isEditing && transactionDetailQuery.isLoading) {
    return (
      <Screen>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (isEditing && transactionDetailQuery.isError) {
    return (
      <Screen>
        <ErrorView message="Transaction could not be loaded." onRetry={() => transactionDetailQuery.refetch()} />
      </Screen>
    );
  }

  const isLoading = accountsQuery.isLoading || categoriesQuery.isLoading || settingsQuery.isLoading;
  const isError = accountsQuery.isError || categoriesQuery.isError || settingsQuery.isError;

  const submit = (rawValues: TransactionFormValues) => {
    const parsed = transactionSchema.safeParse(rawValues);

    if (!parsed.success) {
      setSubmittedErrors({ amount: "Check the transaction details and try again." });
      return;
    }

    const errors = transactionFormErrors(parsed.data, participants);
    setSubmittedErrors(errors);

    if (hasTransactionFormErrors(errors)) {
      return;
    }

    const body = buildTransactionPayload(parsed.data, participants, isSharedVault ? Number(vaultId) : null);

    if (isEditing && transactionId !== null) {
      updateTransaction.mutate(
        {
          body,
          transactionId
        },
        {
          onSuccess: () => router.replace(`/transaction/${transactionId}` as never)
        }
      );
      return;
    }

    createTransaction.mutate(body, {
      onSuccess: () => router.back()
    });
  };

  const chooseTransactionType = (type: TransactionKind) => {
    setValue("transactionType", type);
    setValue("categoryId", 0);

    if (type === "Income") {
      setValue("expenseScope", "Personal");
    }
  };

  return (
    <Screen contentClassName="gap-3 px-5 pb-8 pt-3">
      <View className="h-1.5 w-20 self-center rounded-full bg-surface-border" />
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-sans text-2xl font-bold text-text">{isEditing ? "Edit Transaction" : "Record Transaction"}</Text>
          <Text className="mt-1 font-sans text-base text-text-muted">{isEditing ? "Update the selected transaction" : "Add a new income, expense or transfer"}</Text>
        </View>
        <Pressable
          accessibilityLabel="Close transaction form"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-surface"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="close" size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>

      <View className="flex-row rounded-md border border-surface-border bg-surface p-0.5">
        <TypeTab icon="arrow-down" label="Expense" selected={selectedType === "Expense"} onPress={() => chooseTransactionType("Expense")} />
        <TypeTab icon="arrow-up-right" label="Income" selected={selectedType === "Income"} onPress={() => chooseTransactionType("Income")} />
      </View>

      <View className="items-center gap-2 py-2">
        <View className="h-20 w-full flex-row items-center justify-center">
          <Text className="font-sans text-5xl font-bold leading-[64px] text-text">₹</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                accessibilityLabel="Transaction amount"
                className="h-20 min-w-24 max-w-64 px-1 font-sans text-5xl font-bold leading-[64px] text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(text) => {
                  onChange(text);
                  clearSubmittedError("amount");
                }}
                placeholder="0"
                placeholderTextColor={theme.colors.text.DEFAULT}
                textAlign="center"
                value={value}
              />
            )}
          />
        </View>
        <Text className={visibleErrors.amount ? "font-sans text-sm text-state-danger" : "font-sans text-base text-brand-soft"}>
          {visibleErrors.amount ?? "Enter amount"}
        </Text>
        <DatePill
          locale={locale}
          value={formValues.date}
          onPress={() => {
            setDatePickerValue(formValues.date);
            setDatePickerVisible(true);
          }}
        />
        {visibleErrors.date ? <Text className="font-sans text-xs text-state-danger">{visibleErrors.date}</Text> : null}
      </View>

      {isLoading ? <LoadingSkeleton variant="card" /> : null}
      {isError ? (
        <ErrorView
          message="Form data could not be loaded."
          onRetry={() => {
            accountsQuery.refetch();
            categoriesQuery.refetch();
            settingsQuery.refetch();
          }}
        />
      ) : null}

      <DropdownField
        icon={selectedCategory?.emoji ?? "coffee-outline"}
        label="Category"
        subtitle={selectedCategory?.parentCategory ?? selectedCategory?.categoryType ?? "Choose category"}
        title={selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : "Choose category"}
        error={visibleErrors.categoryId}
        onPress={() => setSelectorTarget("category")}
      />
      <DropdownField
        icon="bank-outline"
        label="Account (Paid From)"
        subtitle={selectedAccount ? balanceLabel(selectedAccount, currencyCode, locale) : "Choose account"}
        title={selectedAccount?.name ?? "Choose account"}
        error={visibleErrors.accountId}
        onPress={() => setSelectorTarget("account")}
      />

      {selectedType === "Expense" ? (
        <View className="gap-2">
          <Text className="font-sans text-sm font-semibold text-text">Expense Type</Text>
          {isSharedVault ? (
            <View className="rounded-md border border-brand bg-brand-deep px-3 py-2">
              <Text className="font-sans text-sm font-semibold text-text">Shared</Text>
              <Text className="font-sans text-xs text-text-muted">Shared vault is active</Text>
            </View>
          ) : (
            <View className="flex-row rounded-md border border-surface-border bg-surface p-0.5">
              {(["Personal", "Shared"] as const).map((scope) => (
                <SegmentButton key={scope} label={scope} selected={selectedScope === scope} onPress={() => setValue("expenseScope", scope)} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {isSharedExpense ? (
        <>
          <DropdownField
            disabled={isSharedVault}
            icon="account-group-outline"
            label="Shared Vault"
            subtitle={`${participants.length} ${participants.length === 1 ? "member" : "members"}`}
            title={selectedSharedVault?.name ?? "Choose shared vault"}
            error={visibleErrors.sharedVaultId}
            onPress={() => setSelectorTarget("sharedVault")}
          />
          <View className="gap-2">
            <Text className="font-sans text-sm font-semibold text-text">Split Type</Text>
            <View className="flex-row rounded-md border border-surface-border bg-surface p-0.5">
              <SplitButton icon="equal" label="Equal" selected={selectedSplitType === ALLOCATION_EQUAL} onPress={() => setValue("splitType", ALLOCATION_EQUAL)} />
              <SplitButton icon="percent-outline" label="Percentage" selected={selectedSplitType === ALLOCATION_PERCENTAGE} onPress={() => setValue("splitType", ALLOCATION_PERCENTAGE)} />
              <SplitButton icon="currency-inr" label="Fixed Amount" selected={selectedSplitType === ALLOCATION_FIXED} onPress={() => setValue("splitType", ALLOCATION_FIXED)} />
            </View>
          </View>
          <SplitPreviewCard
            currencyCode={currencyCode}
            error={visibleErrors.split}
            isLoading={sharedExpensesQuery.isLoading}
            isQueryError={sharedExpensesQuery.isError}
            items={previewItems}
            locale={locale}
            splitType={selectedSplitType}
            values={formValues}
            onAmountChange={(participantId, value) =>
              setValue("allocationAmounts", rebalanceTwoParticipantAmounts(participants, formValues.allocationAmounts, participantId, value, parsedAmount))
            }
            onPercentageChange={(participantId, value) =>
              setValue("allocationPercentages", rebalanceTwoParticipantPercentages(participants, formValues.allocationPercentages, participantId, value))
            }
            onRetry={() => sharedExpensesQuery.refetch()}
          />
        </>
      ) : null}

      <View className="rounded-lg border border-dashed border-brand-muted bg-surface px-4 py-3">
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="min-h-10 font-sans text-base text-text"
              multiline
              onChangeText={onChange}
              placeholder="Add Note (optional)"
              placeholderTextColor={theme.colors.brand.soft}
              value={value}
            />
          )}
        />
      </View>

      {createTransaction.isError || updateTransaction.isError ? <Text className="font-sans text-sm text-state-danger">Transaction could not be saved.</Text> : null}
      <PrimaryButton loading={isSaving} disabled={isSaving || isLoading || isError} onPress={handleSubmit(submit)}>
        {isEditing ? "Save Changes" : "Save Transaction"}
      </PrimaryButton>

      <BottomSheet visible={selectorTarget === "account"} title="Choose Account" onClose={() => setSelectorTarget(null)}>
        <OptionList
          options={(accountsQuery.data ?? []).map((account) => ({
            id: account.id,
            icon: "bank-outline",
            subtitle: balanceLabel(account, currencyCode, locale),
            title: account.name
          }))}
          onSelect={(id) => {
            setValue("accountId", id, { shouldValidate: true });
            clearSubmittedError("accountId");
            setSelectorTarget(null);
          }}
        />
      </BottomSheet>
      <BottomSheet visible={selectorTarget === "category"} title="Choose Category" onClose={() => setSelectorTarget(null)}>
        <SearchField
          value={categorySearch}
          onChangeText={setCategorySearch}
          onClear={() => setCategorySearch("")}
        />
        <OptionList
          emptyMessage={categorySearch.trim() ? "No matching categories." : "No options available."}
          options={visibleCategoryOptions.map((category) => ({
            id: category.id,
            icon: category.emoji,
            subtitle: category.parentCategory ?? category.categoryType,
            title: category.name
          }))}
          onSelect={(id) => {
            setValue("categoryId", id, { shouldValidate: true });
            clearSubmittedError("categoryId");
            setCategorySearch("");
            setSelectorTarget(null);
          }}
        />
      </BottomSheet>
      <BottomSheet visible={selectorTarget === "sharedVault"} title="Choose Shared Vault" onClose={() => setSelectorTarget(null)}>
        <OptionList
          options={sharedVaults.map((sharedVault) => ({
            id: sharedVault.id,
            icon: "account-group-outline",
            subtitle: "Shared vault",
            title: sharedVault.name
          }))}
          onSelect={(id) => {
            setValue("sharedVaultId", id, { shouldValidate: true });
            clearSubmittedError("sharedVaultId");
            setSelectorTarget(null);
          }}
        />
      </BottomSheet>
      <BottomSheet visible={datePickerVisible} title="Transaction Date" onClose={() => setDatePickerVisible(false)}>
        <MonthDatePicker
          locale={locale}
          selectedDate={datePickerValue}
          setSelectedDate={setDatePickerValue}
          onCancel={() => setDatePickerVisible(false)}
          onConfirm={() => {
            setValue("date", datePickerValue, { shouldValidate: true });
            clearSubmittedError("date");
            setDatePickerVisible(false);
          }}
        />
      </BottomSheet>
    </Screen>
  );
}

function TypeTab({ icon, label, onPress, selected }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={selected ? "min-h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded bg-brand-deep" : "min-h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded"}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
      <Text className={selected ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({ label, onPress, selected }: { label: ExpenseScope; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={selected ? "min-h-10 flex-1 items-center justify-center rounded border border-brand bg-brand-deep" : "min-h-10 flex-1 items-center justify-center rounded"}
      onPress={onPress}
    >
      <Text className={selected ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function SplitButton({ icon, label, onPress, selected }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={selected ? "min-h-10 flex-1 flex-row items-center justify-center gap-1 rounded border border-brand bg-brand-deep" : "min-h-10 flex-1 flex-row items-center justify-center gap-1 rounded"}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.xs} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
      <Text className={selected ? "font-sans text-xs font-semibold text-text" : "font-sans text-xs text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function DatePill({ locale, onPress, value }: { locale: string; onPress: () => void; value: string }) {
  return (
    <Pressable
      accessibilityLabel="Choose transaction date"
      accessibilityRole="button"
      className="min-h-11 flex-row items-center gap-2 rounded-full border border-surface-border bg-surface px-4"
      onPress={onPress}
    >
      <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
      <Text className="font-sans text-sm font-semibold text-text">{formatIsoDateOnly(value, locale, { day: "numeric", month: "short", year: "numeric" })}</Text>
      <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
    </Pressable>
  );
}

function DropdownField({
  disabled = false,
  error,
  icon,
  label,
  onPress,
  subtitle,
  title
}: {
  disabled?: boolean;
  error?: string | undefined;
  icon: keyof typeof MaterialCommunityIcons.glyphMap | string;
  label: string;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  const isEmoji = icon.length <= 4 && !icon.includes("-");

  return (
    <View className="gap-1.5">
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
      <Pressable
        accessibilityRole="button"
        className="min-h-12 flex-row items-center gap-3 rounded-md border border-surface-border bg-surface px-3 py-2.5"
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
          {isEmoji ? (
            <Text className="font-sans text-lg">{icon}</Text>
          ) : (
            <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.sm} color={theme.colors.brand.soft} />
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {disabled ? null : <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />}
      </Pressable>
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

function DropdownOptionRow({
  icon,
  onPress,
  subtitle,
  title
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap | string;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  const isEmoji = icon.length <= 4 && !icon.includes("-");

  return (
    <Pressable
      accessibilityRole="menuitem"
      className="min-h-14 flex-row items-center gap-3 border-b border-surface-border py-3 last:border-b-0"
      onPress={onPress}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        {isEmoji ? (
          <Text className="font-sans text-lg">{icon}</Text>
        ) : (
          <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.sm} color={theme.colors.brand.soft} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {title}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function OptionList({
  emptyMessage = "No options available.",
  onSelect,
  options
}: {
  emptyMessage?: string;
  onSelect: (id: number) => void;
  options: { id: number; icon: keyof typeof MaterialCommunityIcons.glyphMap | string; subtitle: string; title: string }[];
}) {
  if (options.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">{emptyMessage}</Text>;
  }

  return (
    <View className="overflow-hidden rounded-lg border border-surface-border bg-surface px-3">
      {options.map((option) => (
        <DropdownOptionRow
          key={option.id}
          icon={option.icon}
          subtitle={option.subtitle}
          title={option.title}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

function SearchField({
  onChangeText,
  onClear,
  value
}: {
  onChangeText: (value: string) => void;
  onClear: () => void;
  value: string;
}) {
  return (
    <View className="mb-3 min-h-12 flex-row items-center gap-2 rounded-md border border-surface-border bg-background px-3">
      <MaterialCommunityIcons name="magnify" size={theme.icons.sm} color={theme.colors.text.muted} />
      <TextInput
        accessibilityLabel="Search categories"
        className="h-12 min-w-0 flex-1 font-sans text-sm text-text"
        onChangeText={onChangeText}
        placeholder="Search categories"
        placeholderTextColor={theme.colors.text.muted}
        value={value}
      />
      {value ? (
        <Pressable accessibilityLabel="Clear category search" accessibilityRole="button" onPress={onClear}>
          <MaterialCommunityIcons name="close-circle" size={theme.icons.sm} color={theme.colors.text.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SplitPreviewCard({
  currencyCode,
  error,
  isLoading,
  isQueryError,
  items,
  locale,
  onAmountChange,
  onPercentageChange,
  onRetry,
  splitType,
  values
}: {
  currencyCode: string;
  error?: string | undefined;
  isLoading: boolean;
  isQueryError: boolean;
  items: SplitPreviewItem[];
  locale: string;
  onAmountChange: (participantId: number, value: string) => void;
  onPercentageChange: (participantId: number, value: string) => void;
  onRetry: () => void;
  splitType: SplitType;
  values: TransactionFormValues;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text-muted">Split Preview</Text>
      <View className="rounded-md border border-surface-border bg-surface px-3 py-2">
        {isLoading ? <Text className="font-sans text-sm text-text-muted">Loading shared vault members...</Text> : null}
        {isQueryError ? (
          <View className="gap-2">
            <Text className="font-sans text-sm text-state-danger">Could not load shared vault members.</Text>
            <Pressable accessibilityRole="button" className="self-start rounded-full border border-brand px-3 py-1.5" onPress={onRetry}>
              <Text className="font-sans text-xs font-semibold text-brand-soft">Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!isLoading && !isQueryError && items.length === 0 ? <Text className="font-sans text-sm text-text-muted">Choose a shared vault to preview the split.</Text> : null}
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center border-b border-surface-border py-2.5 last:border-b-0">
            <View className={item.isCurrent ? "mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-brand" : "mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-brand-deep"}>
              <Text className="font-sans text-xs font-bold text-text">{initials(item.name)}</Text>
            </View>
            <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>
              {item.name}
            </Text>
            {splitType === ALLOCATION_PERCENTAGE ? (
              <TextInput
                className="mr-2 h-10 w-16 rounded-md bg-brand-deep py-0 text-center font-sans text-sm font-semibold leading-5 text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(value) => onPercentageChange(item.id, value)}
                value={values.allocationPercentages[String(item.id)] ?? ""}
              />
            ) : (
              <View className="mr-2 min-w-10 items-center rounded-full bg-brand-deep px-2.5 py-1.5">
                <Text className="font-sans text-xs font-semibold text-brand-soft">{item.percentage}%</Text>
              </View>
            )}
            {splitType === ALLOCATION_FIXED ? (
              <TextInput
                className="h-10 w-[100px] rounded-md border border-surface-border bg-background px-2 py-0 text-center font-sans text-sm font-semibold leading-5 text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(value) => onAmountChange(item.id, value)}
                value={values.allocationAmounts[String(item.id)] ?? ""}
              />
            ) : (
              <Text className="w-20 text-right font-sans text-sm font-semibold text-text">{formatCurrency(item.amount, currencyCode, locale)}</Text>
            )}
          </View>
        ))}
        <View className="mt-1.5 flex-row items-center gap-2">
          <MaterialCommunityIcons name="information-outline" size={theme.icons.xs} color={theme.colors.text.muted} />
          <Text className="flex-1 font-sans text-xs text-text-muted">Split is based on the amount entered above.</Text>
        </View>
      </View>
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

function balanceLabel(account: AccountApi, currencyCode: string, locale: string) {
  const balance = typeof account.balance === "number" ? account.balance : null;
  const balanceText = balance === null ? "Balance unavailable" : `${formatCurrency(balance, currencyCode, locale)} available`;
  return account.type ? `${balanceText} · ${account.type}` : balanceText;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
