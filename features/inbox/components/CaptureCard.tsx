import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { INBOX_COPY } from "@/features/inbox/inboxModel";
import { theme } from "@/theme";

interface CaptureCardProps {
  onPress: () => void;
}

export function CaptureCard({ onPress }: CaptureCardProps) {
  return (
    <Pressable
      accessibilityLabel={INBOX_COPY.captureTitle}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl bg-brand px-4 py-4"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
        <MaterialCommunityIcons color={theme.colors.text.inverse} name="plus" size={theme.icons.lg} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-base font-bold text-text-inverse">{INBOX_COPY.captureTitle}</Text>
        <Text className="font-sans text-sm text-text-inverse/80">{INBOX_COPY.captureSubtitle}</Text>
      </View>
      <MaterialCommunityIcons color={theme.colors.text.inverse} name="chevron-right" size={theme.icons.md} />
    </Pressable>
  );
}
