import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSpendComparisonApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SpendingSpendComparisonSectionProps {
  comparison: ReportSpendComparisonApi | null | undefined;
  currencyCode: CurrencyCode;
  locale: string;
}

const ACTUAL_COLOR = theme.colors.brand.DEFAULT; // Violet #8B5CF6
const PROJECTED_COLOR = theme.colors.accent.emerald; // Emerald #34D399

export function SpendingSpendComparisonSection({
  comparison,
  currencyCode,
  locale
}: SpendingSpendComparisonSectionProps) {
  if (!comparison) {
    return null;
  }

  const { actualSpend, difference, differenceLabel, projectedPersonalSpend } = comparison;
  const total = actualSpend + projectedPersonalSpend;

  if (total <= 0 && difference === 0) {
    return null;
  }

  const actualPercent = total > 0 ? Math.round((actualSpend / total) * 100) : 50;
  const projectedPercent = total > 0 ? 100 - actualPercent : 50;

  const slices = donutSlices(
    [
      { amount: actualSpend, color: ACTUAL_COLOR, key: "actual" },
      { amount: projectedPersonalSpend, color: PROJECTED_COLOR, key: "projected" }
    ],
    total
  );

  const isNetSavings = difference > 0;
  const isNetOwed = difference < 0;

  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">
          Actual vs Projected Personal Spend
        </Text>
      </View>

      <View className="flex-row items-center gap-5">
        <View className="items-center justify-center">
          <Svg height={120} viewBox="0 0 120 120" width={120}>
            {slices.map((slice) => (
              <Path d={slice.path} fill={slice.color} key={slice.key} />
            ))}
          </Svg>
        </View>

        <View className="min-w-0 flex-1 gap-2.5">
          {/* Actual Spend */}
          <View className="gap-0.5">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTUAL_COLOR }} />
              <Text className="font-sans text-xs font-medium text-text-muted" numberOfLines={1}>
                Actual Spend ({actualPercent}%)
              </Text>
            </View>
            <Text className="font-sans text-base font-bold text-text tabular-nums">
              {formatReportValue(actualSpend, "money", currencyCode, locale)}
            </Text>
          </View>

          {/* Projected Personal Spend */}
          <View className="gap-0.5">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROJECTED_COLOR }} />
              <Text className="font-sans text-xs font-medium text-text-muted" numberOfLines={1}>
                Projected Personal Spend ({projectedPercent}%)
              </Text>
            </View>
            <Text className="font-sans text-base font-bold text-text tabular-nums">
              {formatReportValue(projectedPersonalSpend, "money", currencyCode, locale)}
            </Text>
          </View>
        </View>
      </View>

      {/* Difference footer */}
      <View className="flex-row items-center justify-between border-t border-surface-border pt-3">
        <View className="min-w-0 flex-1 pr-2">
          <Text className="font-sans text-xs font-semibold text-text-muted">Difference</Text>
          <Text className="font-sans text-xs text-text-subtle" numberOfLines={1}>
            {differenceLabel}
          </Text>
        </View>
        <Text
          className={`font-sans text-sm font-bold tabular-nums ${
            isNetSavings ? "text-accent-emerald" : isNetOwed ? "text-state-warning" : "text-text"
          }`}
        >
          {difference > 0 ? "+" : ""}
          {formatReportValue(difference, "money", currencyCode, locale)}
        </Text>
      </View>
    </View>
  );
}

function donutSlices(
  items: { amount: number; color: string; key: string }[],
  total: number,
  outerRadius = 52,
  innerRadius = 32,
  center = 60
) {
  if (total <= 0) {
    return [];
  }
  let currentAngle = -90;
  return items.map((item) => {
    const angle = (item.amount / total) * 360;
    const effectiveAngle = Math.min(Math.max(angle, 0), 359.99);
    const startOuter = pointOnCircle(center, center, outerRadius, currentAngle);
    const endOuter = pointOnCircle(center, center, outerRadius, currentAngle + effectiveAngle);
    const startInner = pointOnCircle(center, center, innerRadius, currentAngle + effectiveAngle);
    const endInner = pointOnCircle(center, center, innerRadius, currentAngle);
    const largeArc = effectiveAngle > 180 ? 1 : 0;

    const path = [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
      "Z"
    ].join(" ");

    currentAngle += angle;
    return { ...item, path };
  });
}

function pointOnCircle(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = (Math.PI / 180) * angleDegrees;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}
