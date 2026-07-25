import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { getCategoryIcon } from "@/features/categories/categoryModel";
import type { CategoryIconName } from "@/features/categories/categoryModel";
import type { CategoryApi } from "@/services/api/types";
import { theme } from "@/theme";

interface CategoryIconProps {
  category?: Pick<CategoryApi, "emoji" | "name"> | null;
  color?: string;
  emoji?: string | null;
  icon?: CategoryIconName;
  size?: "sm" | "md";
  tone?: "brand" | "danger" | "success";
}

export function CategoryIcon({ category, color, emoji, icon, size = "md", tone = "brand" }: CategoryIconProps) {
  const resolvedIcon = icon ?? getCategoryIcon(category ?? emoji);
  const iconColor =
    color ??
    {
      brand: theme.colors.brand.soft,
      danger: theme.colors.accent.rose,
      success: theme.colors.state.success
    }[tone];
  const tileSize = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? theme.icons.sm : theme.icons.md;

  return (
    <View className={`${tileSize} flex-shrink-0 items-center justify-center rounded-full bg-brand-deep`}>
      <MaterialCommunityIcons name={resolvedIcon} size={iconSize} color={iconColor} />
    </View>
  );
}
