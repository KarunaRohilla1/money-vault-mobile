import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportReviewItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface ReportDetailsAccordionProps {
  currencyCode: CurrencyCode;
  expanded: boolean;
  locale: string;
  monthlyReview: ReportReviewItemApi[];
  monthlySummary: ReportReviewItemApi[];
  onToggle: () => void;
  sharedInsights: ReportReviewItemApi[];
}

export function ReportDetailsAccordion({
  currencyCode,
  expanded,
  locale,
  monthlyReview,
  monthlySummary,
  onToggle,
  sharedInsights
}: ReportDetailsAccordionProps) {
  const rows = [
    ...groupRows("Cycle review", monthlyReview),
    ...groupRows("Summary", monthlySummary),
    ...groupRows("Shared insights", sharedInsights)
  ];

  return (
    <View className="rounded-xl bg-surface">
      <Pressable
        accessibilityLabel={expanded ? "Collapse report details" : "Expand report details"}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="min-h-14 flex-row items-center justify-between px-4 py-3"
        onPress={onToggle}
      >
        <View>
          <Text className="font-sans text-base font-semibold text-text">Report details</Text>
          <Text className="font-sans text-xs text-text-muted">Cycle review, summary and settlement rows</Text>
        </View>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={theme.icons.md} color={theme.colors.text.muted} />
      </Pressable>

      {expanded ? (
        <View className="border-t border-surface-border px-4 py-2">
          {rows.map((row, index) => {
            if (row.kind === "heading") {
              return (
                <Text key={`${row.title}-${index}`} className="px-1 pb-1 pt-3 font-sans text-xs font-semibold uppercase text-text-subtle">
                  {row.title}
                </Text>
              );
            }

            return (
              <View key={`${row.item.key}-${index}`} className="flex-row items-center justify-between gap-3 border-t border-surface-border/70 py-3">
                <Text className="min-w-0 flex-1 font-sans text-sm text-text-muted">{row.item.label}</Text>
                <Text className="max-w-44 text-right font-sans text-sm font-semibold text-text" numberOfLines={2}>
                  {formatReportValue(row.item.value, row.item.format, currencyCode, locale)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type DetailRow = { kind: "heading"; title: string } | { item: ReportReviewItemApi; kind: "item" };

function groupRows(title: string, rows: ReportReviewItemApi[]): DetailRow[] {
  if (rows.length === 0) {
    return [];
  }

  return [
    {
      kind: "heading",
      title
    },
    ...rows.map((item) => ({
      item,
      kind: "item" as const
    }))
  ];
}
