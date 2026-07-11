import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { IconName } from "@/constants/navigation";
import { theme } from "@/theme";

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View className="min-h-28 flex-1 gap-3 rounded-md border border-surface-border bg-surface p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <View className="gap-1">
        <Text className="font-sans text-xs text-text-muted">{label}</Text>
        <Text className="font-sans text-lg font-semibold text-text">{value}</Text>
      </View>
    </View>
  );
}
