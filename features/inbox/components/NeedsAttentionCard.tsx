import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { INBOX_COPY, needsAttentionMessage } from "@/features/inbox/inboxModel";
import { theme } from "@/theme";

interface NeedsAttentionCardProps {
  count: number;
  onPress: () => void;
}

export function NeedsAttentionCard({ count, onPress }: NeedsAttentionCardProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={needsAttentionMessage(count)}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl border border-brand-muted bg-surface-raised p-4"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-deep">
        <MaterialCommunityIcons color={theme.colors.brand.soft} name="wallet-outline" size={theme.icons.md} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-bold uppercase text-text-muted">Needs Attention</Text>
        <Text className="mt-1 font-sans text-base font-semibold text-text">{needsAttentionMessage(count)}</Text>
      </View>
      <Text className="font-sans text-sm font-semibold text-brand-soft">
        {INBOX_COPY.needsAttentionAction} →
      </Text>
    </Pressable>
  );
}
