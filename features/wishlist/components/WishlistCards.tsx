import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import type { WishlistItemApi, WishlistPriorityApi } from "@/services/api/types";
import { theme } from "@/theme";

export function WishlistSummaryCard({ caption, icon, label, tone, value }: { caption: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; tone: "brand" | "success"; value: React.ReactNode }) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className={`h-14 w-14 items-center justify-center rounded-full ${tone === "success" ? "bg-state-success/15" : "bg-brand/25"}`}>
        <MaterialCommunityIcons name={icon} size={theme.icons.md} color={tone === "success" ? theme.colors.state.success : theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className={`font-sans text-sm font-semibold ${tone === "success" ? "text-state-success" : "text-text"}`}>{label}</Text>
        {typeof value === "string" ? <Text className="font-sans text-2xl font-bold text-brand-soft">{value}</Text> : value}
        <Text className="font-sans text-xs text-text">{caption}</Text>
      </View>
    </View>
  );
}

export function CategoryChip({ icon, label, selected, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} className={`min-h-11 flex-row items-center gap-2 rounded-xl border px-4 ${selected ? "border-brand bg-brand" : "border-surface-border bg-surface"}`} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={selected ? theme.colors.text.DEFAULT : theme.colors.text.muted} />
      <Text className={`font-sans text-sm font-semibold ${selected ? "text-text" : "text-text-muted"}`}>{label}</Text>
    </Pressable>
  );
}

export function WishlistItemCard({ currencyCode, item, locale, onDelete, onEdit, onPress }: { currencyCode: string; item: WishlistItemApi; locale: string; onDelete: () => void; onEdit: () => void; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`${item.name}, ${item.category}, ${priorityLabel(item.priority)}, estimated cost ${item.estimatedCost}`} accessibilityRole="button" className="flex-row items-center gap-3 rounded-xl bg-surface p-3" onLongPress={onDelete} onPress={onPress}>
      <Pressable accessibilityLabel={`Edit ${item.name}`} accessibilityRole="button" className="h-24 w-24 overflow-hidden rounded-xl bg-background-muted" onPress={onEdit}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" /> : <View className="h-full w-full items-center justify-center"><MaterialCommunityIcons name="image-outline" size={theme.icons.lg} color={theme.colors.brand.soft} /></View>}
      </Pressable>
      <View className="min-w-0 flex-1 gap-1">
        <PriorityBadge priority={item.priority} />
        <Text className="font-sans text-lg font-bold text-text">{item.name}</Text>
        <Text className="font-sans text-sm text-text-muted">{item.category}</Text>
        <Text className="font-sans text-xs text-text-muted">Added {formatWishlistDate(item.createdAt)}</Text>
      </View>
      <View className="items-end gap-2">
        <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-lg font-semibold" />
        <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.muted} />
      </View>
    </Pressable>
  );
}

export function PriorityBadge({ priority }: { priority: WishlistPriorityApi }) {
  const color = priorityColor(priority);
  return (
    <View className={`self-start flex-row items-center gap-1 rounded-full border px-2 py-1 ${priorityClass(priority)}`}>
      <MaterialCommunityIcons name={priorityIcon(priority)} size={theme.icons.xs} color={color} />
      <Text className={`font-sans text-xs font-bold ${priorityTextClass(priority)}`}>{priorityLabel(priority)}</Text>
    </View>
  );
}

export function formatWishlistDate(value?: string | null) {
  if (!value) return "recently";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function priorityLabel(priority: WishlistPriorityApi) {
  if (priority === "HIGH") return "High";
  if (priority === "LOW") return "Low";
  return "Medium";
}

function priorityIcon(priority: WishlistPriorityApi) {
  if (priority === "HIGH") return "fire";
  if (priority === "LOW") return "flag-outline";
  return "star-outline";
}

function priorityColor(priority: WishlistPriorityApi) {
  if (priority === "HIGH") return theme.colors.accent.rose;
  if (priority === "MEDIUM") return theme.colors.accent.gold;
  return theme.colors.brand.soft;
}

function priorityClass(priority: WishlistPriorityApi) {
  if (priority === "HIGH") return "border-accent-rose bg-accent-rose/10";
  if (priority === "MEDIUM") return "border-accent-gold bg-accent-gold/10";
  return "border-brand-soft bg-brand/10";
}

function priorityTextClass(priority: WishlistPriorityApi) {
  if (priority === "HIGH") return "text-accent-rose";
  if (priority === "MEDIUM") return "text-accent-gold";
  return "text-brand-soft";
}
