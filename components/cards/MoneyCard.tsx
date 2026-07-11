import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";

interface MoneyCardProps extends PropsWithChildren {
  label: string;
  value: number;
  currencyCode: string;
}

export function MoneyCard({ label, value, currencyCode, children }: MoneyCardProps) {
  return (
    <View className="gap-4 rounded-lg border border-surface-border bg-surface-raised p-5 shadow-card">
      <View className="gap-2">
        <Text className="font-sans text-sm text-text-muted">{label}</Text>
        <CurrencyText value={value} currencyCode={currencyCode} className="text-2xl font-bold text-text" />
      </View>
      {children}
    </View>
  );
}
