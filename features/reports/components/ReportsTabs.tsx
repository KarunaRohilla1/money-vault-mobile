import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { reportTabs, type ReportTabKey } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import { theme } from "@/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function ReportsTabs({ active, onChange }: { active: ReportTabKey; onChange: (tab: ReportTabKey) => void }) {
  return (
    <View className="flex-row border-b border-surface-border">
      {reportTabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cn("min-h-12 flex-1 items-center justify-center gap-1 border-b-2 px-1", selected ? "border-brand" : "border-transparent")}
            key={tab.key}
            onPress={() => onChange(tab.key)}
          >
            <MaterialCommunityIcons name={tab.icon as IconName} size={theme.icons.sm} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
            <Text className={cn("font-sans text-[11px] font-semibold", selected ? "text-brand-soft" : "text-text-muted")} numberOfLines={1}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}