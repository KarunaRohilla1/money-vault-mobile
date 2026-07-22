import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ACCOUNT_TYPES, accountTypeMeta, type AccountType } from "@/services/api/accountTypes";
import { theme } from "@/theme";

interface AccountTypeSelectorProps {
  onSelect: (accountType: AccountType) => void;
  selected: string | null;
}

export function AccountTypeSelector({ onSelect, selected }: AccountTypeSelectorProps) {
  return (
    <ScrollView
      horizontal
      className="-mx-1"
      contentContainerClassName="gap-2 px-1"
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      {ACCOUNT_TYPES.map((accountType) => {
        const meta = accountTypeMeta[accountType];
        const active = selected === accountType;

        return (
          <Pressable
            key={accountType}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`min-h-36 w-36 items-center justify-start rounded-lg border px-3 py-4 ${
              active ? "border-brand-soft bg-brand-muted" : "border-surface-border bg-surface"
            }`}
            onPress={() => onSelect(accountType)}
          >
            <MaterialCommunityIcons name={meta.icon} size={theme.icons.md} color={active ? theme.colors.brand.soft : theme.colors.text.muted} />
            <Text className="mt-2 text-center font-sans text-sm font-semibold leading-5 text-text" numberOfLines={2}>
              {accountType}
            </Text>
            <Text
              className={active ? "mt-1 text-center font-sans text-xs leading-4 text-brand-soft" : "mt-1 text-center font-sans text-xs leading-4 text-text-muted"}
              numberOfLines={3}
            >
              {meta.subtitle}
            </Text>
            {active ? (
              <View className="absolute right-2 top-2">
                <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.brand.soft} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
