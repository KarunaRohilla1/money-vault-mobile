import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import {
  useCreateWishlistItemMutation,
  useDeleteWishlistItemMutation,
  useUpdateWishlistItemMutation,
  useWishlistQuery
} from "@/features/wishlist/api";
import type { AccountApi, WishlistItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

interface WishlistFormState {
  accountId: number | null;
  category: string;
  estimatedCost: string;
  id: number | null;
  name: string;
  notes: string;
  savedAmount: string;
  targetDate: string;
}

const EMPTY_FORM: WishlistFormState = {
  accountId: null,
  category: "General",
  estimatedCost: "",
  id: null,
  name: "",
  notes: "",
  savedAmount: "",
  targetDate: ""
};

export function WishlistScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const wishlistQuery = useWishlistQuery(token, vaultId);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const createItem = useCreateWishlistItemMutation(token, vaultId);
  const updateItem = useUpdateWishlistItemMutation(token, vaultId);
  const deleteItem = useDeleteWishlistItemMutation(token, vaultId);
  const [form, setForm] = useState<WishlistFormState>(EMPTY_FORM);
  const categoryNames = useMemo(
    () => Array.from(new Set([...(wishlistQuery.data?.categories.map((category) => category.name) ?? []), "General"])),
    [wishlistQuery.data?.categories]
  );
  const formError = useMemo(() => {
    const estimatedCost = Number(form.estimatedCost);
    const savedAmount = Number(form.savedAmount || 0);

    if (!form.name.trim()) {
      return "Item name is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (!Number.isFinite(estimatedCost) || estimatedCost <= 0) {
      return "Estimated cost must be greater than zero.";
    }

    if (!Number.isFinite(savedAmount) || savedAmount < 0) {
      return "Saved amount cannot be negative.";
    }

    return null;
  }, [form.category, form.estimatedCost, form.name, form.savedAmount]);
  const isSaving = createItem.isPending || updateItem.isPending;

  const submit = () => {
    if (formError) {
      return;
    }

    const body = {
      accountId: form.accountId,
      category: form.category.trim(),
      estimatedCost: Number(form.estimatedCost),
      name: form.name.trim(),
      notes: form.notes,
      savedAmount: Number(form.savedAmount || 0),
      targetDate: form.targetDate.trim() ? form.targetDate.trim() : null
    };

    if (form.id) {
      updateItem.mutate(
        {
          body,
          itemId: form.id
        },
        {
          onSuccess: () => setForm(EMPTY_FORM)
        }
      );
      return;
    }

    createItem.mutate(body, {
      onSuccess: () => setForm(EMPTY_FORM)
    });
  };

  const editItem = (item: WishlistItemApi) => {
    setForm({
      accountId: item.accountId ?? null,
      category: item.category,
      estimatedCost: String(item.estimatedCost),
      id: item.id,
      name: item.name,
      notes: item.notes,
      savedAmount: String(item.savedAmount),
      targetDate: item.targetDate ?? ""
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Wishlist" description="Track savings progress toward planned purchases." />
      {wishlistQuery.isLoading || accountsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {wishlistQuery.isError ? <ErrorView message="Wishlist could not be loaded." onRetry={() => wishlistQuery.refetch()} /> : null}
      {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} /> : null}
      {wishlistQuery.data ? (
        <View className="gap-6">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Wishlist Progress</Text>
                <Text className="font-sans text-xl font-bold text-text">{wishlistQuery.data.summary.progress}% saved</Text>
              </View>
              <CurrencyText
                value={wishlistQuery.data.summary.totalSaved}
                currencyCode={currencyCode}
                locale={locale}
                className="text-lg font-semibold"
              />
            </View>
            <Text className="font-sans text-sm text-text-muted">
              {wishlistQuery.data.summary.totalItems} items -{" "}
              <CurrencyText value={wishlistQuery.data.summary.totalCost} currencyCode={currencyCode} locale={locale} className="text-sm text-text-muted" />
            </Text>
          </View>

          <Section title={form.id ? "Edit wishlist item" : "Add wishlist item"}>
            <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
              <FormField label="Name" error={formError?.includes("name") ? formError : undefined}>
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onChangeText={(name) => setForm((current) => ({ ...current, name }))}
                  placeholder="New laptop"
                  placeholderTextColor={theme.colors.text.muted}
                  value={form.name}
                />
              </FormField>
              <FormField label="Category" error={formError?.includes("Category") ? formError : undefined}>
                <View className="flex-row flex-wrap gap-2">
                  {categoryNames.map((category) => (
                    <SecondaryButton
                      key={category}
                      className={form.category === category ? "border-brand-soft" : undefined}
                      onPress={() => setForm((current) => ({ ...current, category }))}
                    >
                      {category}
                    </SecondaryButton>
                  ))}
                </View>
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onChangeText={(category) => setForm((current) => ({ ...current, category }))}
                  placeholder="Custom category"
                  placeholderTextColor={theme.colors.text.muted}
                  value={form.category}
                />
              </FormField>
              <FormField label="Savings account">
                <AccountPicker accounts={accountsQuery.data ?? []} selectedId={form.accountId} onSelect={(accountId) => setForm((current) => ({ ...current, accountId }))} />
              </FormField>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField label="Estimated cost" error={formError?.includes("Estimated") ? formError : undefined}>
                    <TextInput
                      className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                      inputMode="decimal"
                      onChangeText={(estimatedCost) => setForm((current) => ({ ...current, estimatedCost }))}
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.muted}
                      value={form.estimatedCost}
                    />
                  </FormField>
                </View>
                <View className="flex-1">
                  <FormField label="Saved" error={formError?.includes("Saved") ? formError : undefined}>
                    <TextInput
                      className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                      inputMode="decimal"
                      onChangeText={(savedAmount) => setForm((current) => ({ ...current, savedAmount }))}
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.muted}
                      value={form.savedAmount}
                    />
                  </FormField>
                </View>
              </View>
              <FormField label="Target date">
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onChangeText={(targetDate) => setForm((current) => ({ ...current, targetDate }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.text.muted}
                  value={form.targetDate}
                />
              </FormField>
              <FormField label="Notes">
                <TextInput
                  className="min-h-16 rounded-md border border-surface-border bg-background px-4 py-3 font-sans text-base text-text"
                  multiline
                  onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
                  placeholder="Optional"
                  placeholderTextColor={theme.colors.text.muted}
                  value={form.notes}
                />
              </FormField>
              <View className="flex-row gap-2">
                <PrimaryButton disabled={Boolean(formError) || isSaving} onPress={submit}>
                  {form.id ? "Save item" : "Add item"}
                </PrimaryButton>
                {form.id ? <SecondaryButton onPress={() => setForm(EMPTY_FORM)}>Cancel</SecondaryButton> : null}
              </View>
            </View>
          </Section>

          {wishlistQuery.data.items.length === 0 ? (
            <EmptyState icon="gift-outline" title="No wishlist items" message="Wishlist items from this vault will appear here." />
          ) : (
            <Section title="Items">
              <View className="gap-3">
                {wishlistQuery.data.items.map((item) => (
                  <View key={item.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                    <View className="flex-row justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-sans text-base font-semibold text-text">{item.name}</Text>
                        <Text className="font-sans text-xs text-text-muted">
                          {item.category}
                          {item.targetDate ? ` - ${item.targetDate}` : ""}
                        </Text>
                      </View>
                      <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                    </View>
                    <Text className="font-sans text-xs text-text-muted">
                      Saved{" "}
                      <CurrencyText value={item.savedAmount} currencyCode={currencyCode} locale={locale} className="text-xs text-text-muted" /> -{" "}
                      {item.progressPercent}%
                    </Text>
                    <View className="flex-row gap-2">
                      <SecondaryButton onPress={() => editItem(item)}>Edit</SecondaryButton>
                      <SecondaryButton disabled={deleteItem.isPending} onPress={() => deleteItem.mutate(item.id)}>
                        Delete
                      </SecondaryButton>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

interface AccountPickerProps {
  accounts: AccountApi[];
  onSelect: (accountId: number | null) => void;
  selectedId: number | null;
}

function AccountPicker({ accounts, onSelect, selectedId }: AccountPickerProps) {
  if (accounts.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">No savings account selected.</Text>;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      <SecondaryButton className={selectedId === null ? "border-brand-soft" : undefined} onPress={() => onSelect(null)}>
        None
      </SecondaryButton>
      {accounts.map((account) => (
        <SecondaryButton
          key={account.id}
          className={selectedId === account.id ? "border-brand-soft" : undefined}
          onPress={() => onSelect(account.id)}
        >
          {account.name}
        </SecondaryButton>
      ))}
    </View>
  );
}
