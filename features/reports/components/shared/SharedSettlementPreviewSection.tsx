import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSharedSettlementPreviewApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedSettlementPreviewSectionProps {
  currencyCode: CurrencyCode;
  locale: string;
  preview: ReportSharedSettlementPreviewApi;
}

export function SharedSettlementPreviewSection({ currencyCode, locale, preview }: SharedSettlementPreviewSectionProps) {
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Settlement Preview</Text>
      <View className="gap-3">
        <PreviewRow label="Current" title={preview.currentLabel} value={formatReportValue(preview.currentAmount, "money", currencyCode, locale)} />
        <MaterialCommunityIcons color={theme.colors.brand.soft} name="arrow-down" size={theme.icons.sm} />
        <PreviewRow label="After Settlement" title="All balances settled" value={formatReportValue(0, "money", currencyCode, locale)} />
        <MaterialCommunityIcons color={theme.colors.brand.soft} name="arrow-down" size={theme.icons.sm} />
        <PreviewRow
          highlight
          label="Projected Personal Spend"
          title="Your true expense for this cycle"
          value={formatReportValue(preview.projectedPersonalSpend, "money", currencyCode, locale)}
        />
      </View>
    </View>
  );
}

function PreviewRow({ highlight = false, label, title, value }: { highlight?: boolean; label: string; title: string; value: string }) {
  return (
    <View className="gap-1 rounded-lg border border-surface-border bg-background-muted p-3">
      <Text className="font-sans text-xs uppercase text-text-muted">{label}</Text>
      <Text className="font-sans text-sm text-text-muted">{title}</Text>
      <Text className={highlight ? "font-sans text-xl font-bold text-accent-emerald tabular-nums" : "font-sans text-lg font-semibold text-text tabular-nums"}>{value}</Text>
    </View>
  );
}
