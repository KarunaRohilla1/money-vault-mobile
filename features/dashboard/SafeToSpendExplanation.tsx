import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui";
import { formatDashboardMoney } from "@/features/dashboard/dashboardLayout";
import {
  SAFE_TO_SPEND_EXPLANATION_BODY,
  SAFE_TO_SPEND_EXPLANATION_TITLE,
  safeToSpendBreakdownAddsUp,
  safeToSpendOperationSymbol
} from "@/features/dashboard/safeToSpendExplanationModel";
import type { SafeToSpendBreakdownApi, SafeToSpendBreakdownItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

const currencyLocale = "en-IN";

interface SafeToSpendExplanationProps {
  breakdown: SafeToSpendBreakdownApi;
  currencyCode: CurrencyCode;
  onClose: () => void;
  safeToSpend: number;
  visible: boolean;
}

function formattedAmount(value: number, currencyCode: CurrencyCode) {
  return formatDashboardMoney(Math.abs(value), currencyCode, currencyLocale);
}

function FormulaLine({ currencyCode, index, item }: { currencyCode: CurrencyCode; index: number; item: SafeToSpendBreakdownItemApi }) {
  const symbol = safeToSpendOperationSymbol(item, index);
  const accessibilityPrefix = symbol === "-" ? "minus" : symbol === "+" ? "plus" : "";

  return (
    <View
      accessibilityLabel={`${item.label}, ${accessibilityPrefix} ${formattedAmount(item.amount, currencyCode)}`.trim()}
      className="min-h-11 flex-row items-center justify-between gap-3 border-b border-surface-border py-2 last:border-b-0"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Text className="w-4 text-center font-sans text-base font-bold text-brand-soft">{symbol}</Text>
        <Text className="min-w-0 flex-1 font-sans text-sm text-text" numberOfLines={2}>
          {item.label}
        </Text>
      </View>
      <Text className="max-w-32 text-right font-sans text-sm font-semibold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {formattedAmount(item.amount, currencyCode)}
      </Text>
    </View>
  );
}

export function SafeToSpendExplanation({ breakdown, currencyCode, onClose, safeToSpend, visible }: SafeToSpendExplanationProps) {
  const addsUp = safeToSpendBreakdownAddsUp({ breakdown, safeToSpend });
  const safeToSpendIsZero = safeToSpend === 0;

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(SAFE_TO_SPEND_EXPLANATION_TITLE);
    }
  }, [visible]);

  return (
    <BottomSheet visible={visible} title={SAFE_TO_SPEND_EXPLANATION_TITLE} onClose={onClose}>
      <View className="gap-4">
        <Text className="font-sans text-sm leading-5 text-text-muted">
          {SAFE_TO_SPEND_EXPLANATION_BODY}
        </Text>

        <View className="overflow-hidden rounded-lg border border-surface-border bg-surface px-3">
          {breakdown.items.map((item, index) => (
            <FormulaLine key={item.key} item={item} currencyCode={currencyCode} index={index} />
          ))}
          <View accessibilityLabel={`Safe to Spend equals ${formatDashboardMoney(safeToSpend, currencyCode, currencyLocale)}`} className="flex-row items-center justify-between gap-3 border-t border-surface-border py-3">
            <Text className="font-sans text-base font-bold text-text">Safe to Spend</Text>
            <Text className="max-w-40 text-right font-sans text-lg font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatDashboardMoney(safeToSpend, currencyCode, currencyLocale)}
            </Text>
          </View>
        </View>

        {!addsUp ? (
          <Text className="font-sans text-xs leading-5 text-state-warning">
            Refresh the Dashboard to update this calculation.
          </Text>
        ) : null}

        {safeToSpendIsZero ? (
          <View className="flex-row gap-2 rounded-lg border border-accent-rose/30 bg-accent-rose/10 p-3">
            <MaterialCommunityIcons name="alert-circle-outline" size={theme.icons.sm} color={theme.colors.accent.rose} />
            <Text className="min-w-0 flex-1 font-sans text-sm leading-5 text-accent-rose">
              Planned obligations exceed currently available funds for this cycle.
            </Text>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}
