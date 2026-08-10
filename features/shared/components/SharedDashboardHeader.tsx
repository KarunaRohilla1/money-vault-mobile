import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { dashboardTypography } from "@/features/dashboard/dashboardLayout";
import { theme } from "@/theme";

export function SharedDashboardHeader() {
  const router = useRouter();

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityLabel="Open more menu"
        accessibilityRole="button"
        className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep"
        onPress={() => router.push("/more" as never)}
      >
        <MaterialCommunityIcons name="account-group" size={theme.icons.lg} color={theme.colors.brand.soft} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text accessibilityRole="header" className="font-sans text-3xl font-bold text-text" numberOfLines={1}>
          Shared Vault
        </Text>
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          Household finances together
        </Text>
      </View>
    </View>
  );
}

export function SharedSectionHeader({
  actionLabel,
  onActionPress,
  title
}: {
  actionLabel?: string;
  onActionPress?: () => void;
  title: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className={dashboardTypography.sectionTitle}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" className="min-h-12 flex-row items-center gap-1 px-1" onPress={onActionPress}>
          <Text className="font-sans text-sm font-semibold text-brand-soft">{actionLabel}</Text>
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.brand.soft} />
        </Pressable>
      ) : null}
    </View>
  );
}
