import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import type { SharedActivityItem } from "@/features/shared/sharedDashboardModel";
import { theme } from "@/theme";

function SharedActivityRow({
  currencyCode,
  item,
  locale
}: {
  currencyCode: string;
  item: SharedActivityItem;
  locale: string;
}) {
  return (
    <View className="min-h-16 flex-row items-center gap-3 border-b border-surface-border py-3 last:border-b-0">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-deep">
        <MaterialCommunityIcons name={item.icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.paidByLabel}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {item.splitLabel}
        </Text>
      </View>
      <View className="items-end gap-1">
        <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
        <Text className="font-sans text-xs text-text-muted">{item.dateLabel}</Text>
      </View>
    </View>
  );
}

export function SharedActivityList({
  currencyCode,
  items,
  locale
}: {
  currencyCode: string;
  items: SharedActivityItem[];
  locale: string;
}) {
  return (
    <View className={`${dashboardLayout.cardClassName} px-4`}>
      {items.map((item) => (
        <SharedActivityRow key={item.id} currencyCode={currencyCode} item={item} locale={locale} />
      ))}
    </View>
  );
}
