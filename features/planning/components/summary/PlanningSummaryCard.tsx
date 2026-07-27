import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { theme } from "@/theme";

interface CompactSummaryCardProps {
  accessibilityLabel: string;
  cardWidth: number;
  children: ReactNode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  tone: "brand" | "success" | "warning";
}

export function CompactSummaryCard({ accessibilityLabel, cardWidth, children, icon, title, tone }: CompactSummaryCardProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} className="min-h-44 gap-3 rounded-xl border border-surface-border bg-surface p-4" style={{ width: cardWidth }}>
      <View className="flex-row items-center gap-2">
        <View className={`h-9 w-9 items-center justify-center rounded-lg ${toneBackground(tone)}`}>
          <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={toneColor(tone)} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-sm font-bold uppercase text-text" numberOfLines={1}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function PercentageBadge({ percent, tone }: { percent: number; tone: "brand" | "success" | "warning" }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${toneBackground(tone)}`}>
      <Text className={`font-sans text-xs font-bold ${toneTextClass(tone)}`}>{percent}%</Text>
    </View>
  );
}

export function DetailLine({ label, value, valueClassName = "text-text" }: { label: string; value: ReactNode; valueClassName?: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      {typeof value === "string" ? <Text className={`font-sans text-xs font-semibold ${valueClassName}`}>{value}</Text> : value}
    </View>
  );
}

function toneBackground(tone: "brand" | "success" | "warning") {
  if (tone === "success") return "bg-state-success/10";
  if (tone === "warning") return "bg-accent-gold/10";
  return "bg-brand-deep";
}

function toneColor(tone: "brand" | "success" | "warning") {
  if (tone === "success") return theme.colors.state.success;
  if (tone === "warning") return theme.colors.accent.gold;
  return theme.colors.brand.soft;
}

function toneTextClass(tone: "brand" | "success" | "warning") {
  if (tone === "success") return "text-state-success";
  if (tone === "warning") return "text-accent-gold";
  return "text-brand-soft";
}
