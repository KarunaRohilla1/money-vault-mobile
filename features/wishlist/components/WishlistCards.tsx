import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import type { WishlistItemApi, WishlistPriorityApi } from "@/services/api/types";
import { theme } from "@/theme";

export function WishlistSummaryCard({ caption, icon, label, tone, value }: { caption: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; tone: "brand" | "success"; value: React.ReactNode }) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface p-3">
      <View className={`h-11 w-11 items-center justify-center rounded-full ${tone === "success" ? "bg-state-success/15" : "bg-brand/25"}`}>
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={tone === "success" ? theme.colors.state.success : theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className={`font-sans text-sm font-semibold ${tone === "success" ? "text-state-success" : "text-text"}`}>{label}</Text>
        {typeof value === "string" ? <Text className="font-sans text-xl font-bold text-brand-soft">{value}</Text> : value}
        <Text className="font-sans text-xs text-text">{caption}</Text>
      </View>
    </View>
  );
}

export function WishlistCompactSummary({
  activeCost,
  activeCount,
  currencyCode,
  historyCount,
  historySpent,
  locale,
  tab
}: {
  activeCost: number;
  activeCount: number;
  currencyCode: string;
  historyCount: number;
  historySpent: number;
  locale: string;
  tab: "active" | "history";
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-3">
      {tab === "active" ? (
        <>
          <View className="min-w-0 flex-1 items-start justify-center gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="shopping-outline" size={14} color={theme.colors.brand.soft} />
              <Text className="font-sans text-[11px] font-medium text-text-muted">Pending Items</Text>
            </View>
            <Text className="font-sans text-sm font-bold text-text">
              {activeCount} {activeCount === 1 ? "item" : "items"}
            </Text>
          </View>

          <View className="mx-3 h-7 w-px bg-surface-border" />

          <View className="min-w-0 flex-1 items-end justify-center gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="wallet-outline" size={14} color={theme.colors.brand.soft} />
              <Text className="font-sans text-[11px] font-medium text-text-muted">Target Total</Text>
            </View>
            <CurrencyText
              value={activeCost}
              currencyCode={currencyCode}
              locale={locale}
              className="text-sm font-bold text-brand-soft"
            />
          </View>
        </>
      ) : (
        <>
          <View className="min-w-0 flex-1 items-start justify-center gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={theme.colors.state.success} />
              <Text className="font-sans text-[11px] font-medium text-text-muted">Purchased Items</Text>
            </View>
            <Text className="font-sans text-sm font-bold text-state-success">
              {historyCount} {historyCount === 1 ? "item" : "items"}
            </Text>
          </View>

          <View className="mx-3 h-7 w-px bg-surface-border" />

          <View className="min-w-0 flex-1 items-end justify-center gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="cash-check" size={14} color={theme.colors.state.success} />
              <Text className="font-sans text-[11px] font-medium text-text-muted">Total Spent</Text>
            </View>
            <CurrencyText
              value={historySpent}
              currencyCode={currencyCode}
              locale={locale}
              className="text-sm font-bold text-state-success"
            />
          </View>
        </>
      )}
    </View>
  );
}

export function CategoryChip({ icon, label, selected, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-8 flex-row items-center gap-1.5 rounded-full border px-3 py-1 ${
        selected ? "border-brand bg-brand" : "border-surface-border bg-surface"
      }`}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.xs} color={selected ? theme.colors.text.DEFAULT : theme.colors.text.muted} />
      <Text className={`font-sans text-xs font-semibold ${selected ? "text-text" : "text-text-muted"}`}>{label}</Text>
    </Pressable>
  );
}

export function WishlistItemCard({
  currencyCode,
  item,
  locale,
  onComplete,
  onDelete,
  onEdit,
  onPress
}: {
  currencyCode: string;
  item: WishlistItemApi;
  locale: string;
  onComplete?: ((item: WishlistItemApi) => void) | undefined;
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
}) {
  const isCompleted = (item.status ?? "ACTIVE").toUpperCase() === "COMPLETED";

  return (
    <Pressable
      accessibilityLabel={`${item.name}, ${item.category}, ${isCompleted ? "Purchased" : priorityLabel(item.priority)}, target ${item.estimatedCost}${isCompleted && item.purchasedAmount != null ? `, paid ${item.purchasedAmount}` : ""}`}
      accessibilityRole="button"
      className={`rounded-xl border p-3 ${isCompleted ? "border-state-success/30 bg-surface/90" : "border-surface-border bg-surface"}`}
      onLongPress={onDelete}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel={`Edit ${item.name}`}
          accessibilityRole="button"
          className="h-16 w-16 overflow-hidden rounded-xl bg-background-muted"
          onPress={onEdit}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <MaterialCommunityIcons
                name={isCompleted ? "check-circle-outline" : "image-outline"}
                size={theme.icons.md}
                color={isCompleted ? theme.colors.state.success : theme.colors.brand.soft}
              />
            </View>
          )}
        </Pressable>
        <View className="min-w-0 flex-1 gap-0.5">
          {isCompleted ? <PurchaseBadge date={item.purchasedDate} /> : <PriorityBadge priority={item.priority} />}
          <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            {item.category}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          {isCompleted ? (
            <>
              <CurrencyText
                value={item.purchasedAmount ?? item.estimatedCost}
                currencyCode={currencyCode}
                locale={locale}
                className="text-sm font-bold text-state-success"
              />
              <Text className="font-sans text-[11px] text-text-muted">
                Target: <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-[11px] text-text-muted" />
              </Text>
            </>
          ) : (
            <>
              <CurrencyText
                value={item.estimatedCost}
                currencyCode={currencyCode}
                locale={locale}
                className="text-sm font-bold text-text"
              />
              <Text className="font-sans text-[11px] text-text-muted">Target</Text>
            </>
          )}
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.muted} />
        </View>
      </View>

      {onComplete && !isCompleted ? (
        <View className="mt-2 flex-row items-center justify-end border-t border-surface-border/50 pt-2">
          <Pressable
            accessibilityLabel={`Mark ${item.name} as purchased`}
            accessibilityRole="button"
            className="flex-row items-center gap-1 rounded-lg border border-state-success/40 bg-state-success/10 px-2.5 py-1"
            onPress={(e) => {
              e.stopPropagation();
              onComplete(item);
            }}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.xs} color={theme.colors.state.success} />
            <Text className="font-sans text-xs font-bold text-state-success">Mark as Purchased</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

export function PurchaseBadge({ date }: { date?: string | null | undefined }) {
  return (
    <View className="self-start flex-row items-center gap-1 rounded-full border border-state-success/30 bg-state-success/10 px-2 py-0.5">
      <MaterialCommunityIcons name="check-circle" size={theme.icons.xs} color={theme.colors.state.success} />
      <Text className="font-sans text-xs font-bold text-state-success">
        Purchased
      </Text>
    </View>
  );
}

export function PriorityBadge({ priority }: { priority: WishlistPriorityApi }) {
  const color = priorityColor(priority);
  return (
    <View className={`self-start flex-row items-center gap-1 rounded-full border px-2 py-0.5 ${priorityClass(priority)}`}>
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
