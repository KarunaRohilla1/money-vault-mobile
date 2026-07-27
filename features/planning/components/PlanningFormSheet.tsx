import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { BottomSheet, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { PlanningFormState } from "@/features/planning/planningModel";
import type { AccountApi } from "@/services/api/types";
import { theme } from "@/theme";

interface PlanningFormSheetProps {
  accounts: AccountApi[];
  error: string | null;
  form: PlanningFormState;
  isSaving: boolean;
  onChange: (form: PlanningFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  visible: boolean;
}

export function PlanningFormSheet({ accounts, error, form, isSaving, onChange, onClose, onSubmit, visible }: PlanningFormSheetProps) {
  return (
    <BottomSheet visible={visible} title={`${form.id ? "Edit" : "Add"} ${form.kind === "income" ? "Income" : "Commitment"}`} onClose={onClose}>
      <View className="gap-4">
        <FormField label="Name">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
            onChangeText={(name) => onChange({ ...form, name })}
            value={form.name}
          />
        </FormField>
        <FormField label="Account">
          <AccountPicker accounts={accounts} selectedId={form.accountId} onSelect={(accountId) => onChange({ ...form, accountId })} />
        </FormField>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Amount">
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(amount) => onChange({ ...form, amount })}
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                value={form.amount}
              />
            </FormField>
          </View>
          <View className="w-28">
            <FormField label="Due day">
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                inputMode="numeric"
                keyboardType="number-pad"
                onChangeText={(dueDay) => onChange({ ...form, dueDay })}
                placeholder="1"
                placeholderTextColor={theme.colors.text.muted}
                value={form.dueDay}
              />
            </FormField>
          </View>
        </View>
        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        <PrimaryButton disabled={isSaving} loading={isSaving} onPress={onSubmit}>
          {form.id ? "Save item" : "Add item"}
        </PrimaryButton>
      </View>
    </BottomSheet>
  );
}

function AccountPicker({ accounts, onSelect, selectedId }: { accounts: AccountApi[]; onSelect: (accountId: number) => void; selectedId: number | null }) {
  if (accounts.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">Create an account before adding a planning item.</Text>;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {accounts.map((account) => {
        const selected = selectedId === account.id;
        return (
          <SecondaryButton
            key={account.id}
            className={selected ? "border-brand bg-brand/25" : undefined}
            {...(selected ? { icon: "check-circle" as const } : {})}
            onPress={() => onSelect(account.id)}
          >
            {account.name}
          </SecondaryButton>
        );
      })}
    </View>
  );
}
