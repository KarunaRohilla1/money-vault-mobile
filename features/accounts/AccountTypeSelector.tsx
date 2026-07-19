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
            className={`h-28 w-32 items-center justify-center rounded-lg border px-3 py-3 ${
              active ? "border-brand-soft bg-brand-muted" : "border-surface-border bg-surface"
            }`}
            onPress={() => onSelect(accountType)}
          >
            <MaterialCommunityIcons name={meta.icon} size={theme.icons.lg} color={active ? theme.colors.brand.soft : theme.colors.text.muted} />
            <Text className="mt-2 text-center font-sans text-sm font-semibold text-text">{accountType}</Text>
            <Text className={active ? "mt-1 text-center font-sans text-xs text-brand-soft" : "mt-1 text-center font-sans text-xs text-text-muted"}>
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
