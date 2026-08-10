import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { formatReportValue } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedHeroApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedHeroSectionProps {
  currencyCode: CurrencyCode;
  hero: ReportSharedHeroApi;
  locale: string;
}

export function SharedHeroSection({ currencyCode, hero, locale }: SharedHeroSectionProps) {
  const actual = hero.actualSpend;
  const projected = hero.projectedPersonalSpend;
  const differenceDirection = hero.difference > 0 ? "down" : hero.difference < 0 ? "up" : "flat";
  const differenceTone = hero.difference > 0 ? "text-accent-emerald" : hero.difference < 0 ? "text-accent-rose" : "text-text-muted";

  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface-raised p-5">
      <View className="flex-row gap-4">
        <View className="min-w-0 flex-1 gap-2">
          <Text className="font-sans text-xs font-bold uppercase tracking-wide text-brand-soft">Projected Personal Spend</Text>
          <Text className="font-sans text-sm text-text-muted">After settlement</Text>
          <Text adjustsFontSizeToFit className="font-sans text-4xl font-semibold text-text tabular-nums" minimumFontScale={0.72} numberOfLines={1}>
            {formatReportValue(hero.projectedPersonalSpend, "money", currencyCode, locale)}
          </Text>
          <View className="flex-row items-center gap-1">
            {differenceDirection === "down" ? <MaterialCommunityIcons color={theme.colors.accent.emerald} name="arrow-down" size={theme.icons.xs} /> : null}
            {differenceDirection === "up" ? <MaterialCommunityIcons color={theme.colors.accent.rose} name="arrow-up" size={theme.icons.xs} /> : null}
            <Text className={cn("font-sans text-sm", differenceTone)}>
              {formatReportValue(Math.abs(hero.difference), "money", currencyCode, locale)} {hero.comparisonLabel}
            </Text>
          </View>
        </View>

        <View className="items-center justify-center gap-2">
          <View className="flex-row items-center gap-2">
            <MiniDonut amount={actual} color={theme.colors.brand.DEFAULT} currencyCode={currencyCode} label="Actual Spend" locale={locale} />
            <MaterialCommunityIcons color={theme.colors.brand.soft} name="arrow-right" size={theme.icons.sm} />
            <MiniDonut amount={projected} color={theme.colors.accent.emerald} currencyCode={currencyCode} label="Projected Spend" locale={locale} />
          </View>
          <View className="items-end">
            <Text className="font-sans text-xs text-text-muted">Difference</Text>
            <Text className={cn("font-sans text-base font-bold tabular-nums", differenceTone)}>
              {formatReportValue(-hero.difference, "money", currencyCode, locale)}
            </Text>
            <Text className="font-sans text-xs text-text-muted">{hero.percentLower}% lower</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MiniDonut({ amount, color, currencyCode, label, locale }: { amount: number; color: string; currencyCode: CurrencyCode; label: string; locale: string }) {
  const path = pieSlicePath(amount, Math.max(amount, 1));

  return (
    <View className="items-center gap-1">
      <Svg height={72} viewBox="0 0 72 72" width={72}>
        <Path d={path} fill={color} />
        <Path d="M36 36 L36 8 A28 28 0 1 1 35.9 8 Z" fill={theme.colors.surface.DEFAULT} opacity={0.92} />
      </Svg>
      <Text className="max-w-[84px] text-center font-sans text-[10px] text-text-muted" numberOfLines={2}>{label}</Text>
      <Text className="font-sans text-xs font-semibold text-text tabular-nums">{formatReportValue(amount, "money", currencyCode, locale)}</Text>
    </View>
  );
}

function pieSlicePath(amount: number, total: number) {
  const radius = 28;
  const center = 36;
  const angle = total > 0 ? Math.min(360, (amount / total) * 360) : 0;
  const start = pointOnCircle(center, center, radius, -90);
  const end = pointOnCircle(center, center, radius, -90 + angle);
  const largeArc = angle > 180 ? 1 : 0;

  return [`M ${center} ${center}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`, "Z"].join(" ");
}

function pointOnCircle(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = (Math.PI / 180) * angleDegrees;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}
