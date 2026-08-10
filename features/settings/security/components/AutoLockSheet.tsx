import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui";
import { AUTO_LOCK_OPTIONS, type AutoLockTimeout } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

interface AutoLockSheetProps {
  onClose: () => void;
  onSelect: (timeout: AutoLockTimeout) => void;
  selected: AutoLockTimeout;
  visible: boolean;
}

export function AutoLockSheet({ onClose, onSelect, selected, visible }: AutoLockSheetProps) {
  return (
    <BottomSheet onClose={onClose} title="Auto Lock" visible={visible}>
      <View className="gap-2">
        {AUTO_LOCK_OPTIONS.map((option) => {
          const isSelected = option.value === selected;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className="min-h-12 flex-row items-center justify-between rounded-lg border border-surface-border bg-background-muted px-4 py-3"
              key={option.value}
              onPress={() => onSelect(option.value)}
            >
              <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.3}>
                {option.label}
              </Text>
              <MaterialCommunityIcons
                color={isSelected ? theme.colors.brand.soft : theme.colors.text.subtle}
                name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                size={theme.icons.md}
              />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
