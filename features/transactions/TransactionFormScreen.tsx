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
import { DateField, MonthDatePicker } from "@/features/transfers/TransfersScreen";
import { useCreateTransactionMutation } from "@/features/transactions/api";
import {
  ALLOCATION_EQUAL,
  ALLOCATION_FIXED,
  ALLOCATION_PERCENTAGE,
  amountError,
  buildTransactionPayload,
  defaultSplitValues,
  hasTransactionFormErrors,
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
import { todayLocalIso } from "@/lib/date";
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
  transactionType: z.enum(["Expense", "Income", "Transfer"])
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
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(todayLocalIso());
  const [submittedErrors, setSubmittedErrors] = useState<TransactionFormErrorMap>({});
  const createTransaction = useCreateTransactionMutation(token, vaultId);
  const isEditing = transactionId !== null;
  const isSaving = createTransaction.isPending;

  const { control, handleSubmit, setValue } = useForm<TransactionFormValues>({
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
  const isSharedExpense = selectedType === "Expense" && selectedScope === "Shared";
  const clearSubmittedError = (field: keyof TransactionFormErrorMap) => {
    setSubmittedErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

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

  if (isEditing) {
    return (
      <Screen>
        <ErrorView message="Editing transactions is not part of this slice yet." onRetry={() => router.back()} />
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

    createTransaction.mutate(buildTransactionPayload(parsed.data, participants, isSharedVault ? Number(vaultId) : null), {
      onSuccess: () => router.back()
    });
  };

  const chooseTransactionType = (type: TransactionKind) => {
    if (type === "Transfer") {
      router.replace("/transfers");
      return;
    }

    setValue("transactionType", type);
    setValue("categoryId", 0);

    if (type === "Income") {
      setValue("expenseScope", "Personal");
    }
  };

  return (
    <Screen contentClassName="gap-4 px-5 pb-8 pt-3">
      <View className="h-1.5 w-20 self-center rounded-full bg-surface-border" />
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-sans text-2xl font-bold text-text">Record Transaction</Text>
          <Text className="mt-1 font-sans text-base text-text-muted">Add a new income, expense or transfer</Text>
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

      <View className="flex-row rounded-lg border border-surface-border bg-surface p-1">
        <TypeTab icon="arrow-down" label="Expense" selected={selectedType === "Expense"} onPress={() => chooseTransactionType("Expense")} />
        <TypeTab icon="arrow-up-right" label="Income" selected={selectedType === "Income"} onPress={() => chooseTransactionType("Income")} />
        <TypeTab icon="swap-horizontal" label="Transfer" selected={false} onPress={() => chooseTransactionType("Transfer")} />
      </View>

      <View className="items-center gap-2 py-5">
        <View className="flex-row items-center justify-center">
          <Text className="font-sans text-6xl font-bold text-text">₹</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                accessibilityLabel="Transaction amount"
                className="min-w-28 max-w-72 font-sans text-6xl font-bold text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(text) => {
                  onChange(text);
                  clearSubmittedError("amount");
                }}
                placeholder="0"
                placeholderTextColor={theme.colors.text.DEFAULT}
                textAlign="left"
                value={value}
              />
            )}
          />
        </View>
        <Text className={visibleErrors.amount ? "font-sans text-sm text-state-danger" : "font-sans text-base text-brand-soft"}>
          {visibleErrors.amount ?? "Enter amount"}
        </Text>
        <DateField
          label=""
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

      <SelectorRow
        icon={selectedCategory?.emoji ?? "coffee-outline"}
        label="Category"
        subtitle={selectedCategory?.parentCategory ?? selectedCategory?.categoryType ?? "Choose category"}
        title={selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : "Choose category"}
        error={visibleErrors.categoryId}
        onPress={() => setSelectorTarget("category")}
      />
      <SelectorRow
        icon="bank-outline"
        label="Account (Paid From)"
        subtitle={selectedAccount ? balanceLabel(selectedAccount, currencyCode, locale) : "Choose account"}
        title={selectedAccount?.name ?? "Choose account"}
        error={visibleErrors.accountId}
        onPress={() => setSelectorTarget("account")}
      />

      {selectedType === "Expense" ? (
        <View className="gap-2">
          <Text className="font-sans text-base text-text">Expense Type</Text>
          {isSharedVault ? (
            <View className="rounded-lg border border-brand bg-brand-deep px-4 py-3">
              <Text className="font-sans text-base font-semibold text-text">Shared</Text>
              <Text className="font-sans text-xs text-text-muted">Shared vault is active</Text>
            </View>
          ) : (
            <View className="flex-row rounded-lg border border-surface-border bg-surface p-1">
              {(["Personal", "Shared"] as const).map((scope) => (
                <SegmentButton key={scope} label={scope} selected={selectedScope === scope} onPress={() => setValue("expenseScope", scope)} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {isSharedExpense ? (
        <>
          <SelectorRow
            disabled={isSharedVault}
            icon="account-group-outline"
            label="Shared Vault"
            subtitle={`${participants.length} ${participants.length === 1 ? "member" : "members"}`}
            title={selectedSharedVault?.name ?? "Choose shared vault"}
            error={visibleErrors.sharedVaultId}
            onPress={() => setSelectorTarget("sharedVault")}
          />
          <View className="gap-2">
            <Text className="font-sans text-base text-text">Split Type</Text>
            <View className="flex-row rounded-lg border border-surface-border bg-surface p-1">
              <SplitButton icon="equal" label="Equal" selected={selectedSplitType === ALLOCATION_EQUAL} onPress={() => setValue("splitType", ALLOCATION_EQUAL)} />
              <SplitButton icon="percent-outline" label="Percentage" selected={selectedSplitType === ALLOCATION_PERCENTAGE} onPress={() => setValue("splitType", ALLOCATION_PERCENTAGE)} />
              <SplitButton icon="currency-inr" label="Fixed Amount" selected={selectedSplitType === ALLOCATION_FIXED} onPress={() => setValue("splitType", ALLOCATION_FIXED)} />
            </View>
          </View>
          <SplitPreviewCard
            currencyCode={currencyCode}
            error={visibleErrors.split}
            items={previewItems}
            locale={locale}
            splitType={selectedSplitType}
            values={formValues}
            onAmountChange={(participantId, value) =>
              setValue("allocationAmounts", {
                ...formValues.allocationAmounts,
                [String(participantId)]: value
              })
            }
            onPercentageChange={(participantId, value) =>
              setValue("allocationPercentages", {
                ...formValues.allocationPercentages,
                [String(participantId)]: value
              })
            }
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

      {createTransaction.isError ? <Text className="font-sans text-sm text-state-danger">Transaction could not be saved.</Text> : null}
      <PrimaryButton loading={isSaving} disabled={isSaving || isLoading || isError} onPress={handleSubmit(submit)}>
        Save Transaction
      </PrimaryButton>
      <TrustStrip />

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
        <OptionList
          options={categoryOptions.map((category) => ({
            id: category.id,
            icon: category.emoji,
            subtitle: category.parentCategory ?? category.categoryType,
            title: category.name
          }))}
          onSelect={(id) => {
            setValue("categoryId", id, { shouldValidate: true });
            clearSubmittedError("categoryId");
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
      className={selected ? "min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-md bg-brand-deep" : "min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-md"}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
      <Text className={selected ? "font-sans text-base font-semibold text-text" : "font-sans text-base text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({ label, onPress, selected }: { label: ExpenseScope; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={selected ? "min-h-14 flex-1 items-center justify-center rounded-md border border-brand bg-brand-deep" : "min-h-14 flex-1 items-center justify-center rounded-md"}
      onPress={onPress}
    >
      <Text className={selected ? "font-sans text-base font-semibold text-text" : "font-sans text-base text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function SplitButton({ icon, label, onPress, selected }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={selected ? "min-h-12 flex-1 flex-row items-center justify-center gap-1 rounded-md border border-brand bg-brand-deep" : "min-h-12 flex-1 flex-row items-center justify-center gap-1 rounded-md"}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
      <Text className={selected ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

function SelectorRow({
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
    <View className="gap-2">
      <Text className="font-sans text-base text-text">{label}</Text>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center gap-4 rounded-lg border border-surface-border bg-surface px-4 py-4"
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
      >
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-deep">
          {isEmoji ? (
            <Text className="font-sans text-2xl">{icon}</Text>
          ) : (
            <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.lg} color={theme.colors.brand.soft} />
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-lg font-semibold text-text" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {disabled ? null : <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.muted} />}
      </Pressable>
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

function OptionList({
  onSelect,
  options
}: {
  onSelect: (id: number) => void;
  options: { id: number; icon: keyof typeof MaterialCommunityIcons.glyphMap | string; subtitle: string; title: string }[];
}) {
  if (options.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">No options available.</Text>;
  }

  return (
    <View className="gap-2">
      {options.map((option) => (
        <SelectorRow
          key={option.id}
          icon={option.icon}
          label=""
          subtitle={option.subtitle}
          title={option.title}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

function SplitPreviewCard({
  currencyCode,
  error,
  items,
  locale,
  onAmountChange,
  onPercentageChange,
  splitType,
  values
}: {
  currencyCode: string;
  error?: string | undefined;
  items: SplitPreviewItem[];
  locale: string;
  onAmountChange: (participantId: number, value: string) => void;
  onPercentageChange: (participantId: number, value: string) => void;
  splitType: SplitType;
  values: TransactionFormValues;
}) {
  return (
    <View className="gap-3">
      <Text className="font-sans text-base text-text-muted">Split Preview</Text>
      <View className="rounded-lg border border-surface-border bg-surface px-4 py-3">
        {items.length === 0 ? <Text className="font-sans text-sm text-text-muted">Choose a shared vault to preview the split.</Text> : null}
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center border-b border-surface-border py-3 last:border-b-0">
            <View className={item.isCurrent ? "mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand" : "mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-deep"}>
              <Text className="font-sans text-sm font-bold text-text">{initials(item.name)}</Text>
            </View>
            <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
              {item.name}
            </Text>
            {splitType === ALLOCATION_PERCENTAGE ? (
              <TextInput
                className="mr-3 h-10 w-20 rounded-full bg-brand-deep text-center font-sans text-sm font-semibold text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(value) => onPercentageChange(item.id, value)}
                value={values.allocationPercentages[String(item.id)] ?? ""}
              />
            ) : (
              <View className="mr-3 rounded-full bg-brand-deep px-4 py-2">
                <Text className="font-sans text-sm font-semibold text-brand-soft">{item.percentage}%</Text>
              </View>
            )}
            {splitType === ALLOCATION_FIXED ? (
              <TextInput
                className="h-10 w-24 rounded-md border border-surface-border bg-background text-center font-sans text-sm font-semibold text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(value) => onAmountChange(item.id, value)}
                value={values.allocationAmounts[String(item.id)] ?? ""}
              />
            ) : (
              <Text className="w-24 text-right font-sans text-base font-semibold text-text">{formatCurrency(item.amount, currencyCode, locale)}</Text>
            )}
          </View>
        ))}
        <View className="mt-2 flex-row items-center gap-2">
          <MaterialCommunityIcons name="information-outline" size={theme.icons.sm} color={theme.colors.text.muted} />
          <Text className="flex-1 font-sans text-xs text-text-muted">Split is based on the amount entered above.</Text>
        </View>
      </View>
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

function TrustStrip() {
  const items = [
    { icon: "lightning-bolt-outline", title: "Quick & Easy", body: "Save in 5 seconds" },
    { icon: "shield-lock-outline", title: "100% Secure", body: "Your data is safe" },
    { icon: "creation-outline", title: "Smart Defaults", body: "Learns your habits" }
  ] as const;

  return (
    <View className="flex-row rounded-lg border border-surface-border bg-surface px-3 py-4">
      {items.map((item, index) => (
        <View key={item.title} className={index === items.length - 1 ? "flex-1 flex-row gap-2" : "mr-2 flex-1 flex-row gap-2 border-r border-surface-border pr-2"}>
          <MaterialCommunityIcons name={item.icon} size={theme.icons.sm} color={index === 0 ? theme.colors.state.warning : theme.colors.brand.soft} />
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-xs font-semibold text-text" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
              {item.body}
            </Text>
          </View>
        </View>
      ))}
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
