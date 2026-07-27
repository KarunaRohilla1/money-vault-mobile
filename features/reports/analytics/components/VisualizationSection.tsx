import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { selectedChartItem, type ChartDataItem } from "@/features/reports/analytics/analyticsAdapter";
import { formatReportValue } from "@/features/reports/reportModel";
import type { CurrencyCode } from "@/types/domain";

export function VisualizationSection({ currencyCode, items, locale, onSelect, selectedKey, title, total, type }: {
  currencyCode: CurrencyCode;
  items: ChartDataItem[];
  locale: string;
  onSelect: (key: string) => void;
  selectedKey: string | null;
  title: string;
  total: number;
  type: "donut" | "horizontalBar" | "verticalBar" | "percentageBar";
}) {
  const selected = selectedChartItem(items, selectedKey);
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="min-w-0 flex-1 font-sans text-sm font-bold uppercase text-brand-soft" numberOfLines={1}>{title}</Text>
        {items.length > 0 ? <Text className="font-sans text-xs text-text-muted">{items.length} rows</Text> : null}
      </View>
      {items.length === 0 ? <Text className="py-8 text-center font-sans text-sm text-text-muted">No data for this analysis.</Text> : null}
      {type === "donut" || type === "percentageBar" ? <PieChart currencyCode={currencyCode} items={items} locale={locale} onSelect={onSelect} selected={selected} total={total} /> : null}
      {type === "horizontalBar" ? <Bars direction="horizontal" currencyCode={currencyCode} items={items} locale={locale} onSelect={onSelect} selectedKey={selected?.key ?? null} /> : null}
      {type === "verticalBar" ? <Bars direction="vertical" currencyCode={currencyCode} items={items} locale={locale} onSelect={onSelect} selectedKey={selected?.key ?? null} /> : null}
    </View>
  );
}

function PieChart({ currencyCode, items, locale, onSelect, selected, total }: { currencyCode: CurrencyCode; items: ChartDataItem[]; locale: string; onSelect: (key: string) => void; selected: ChartDataItem | null; total: number }) {
  const slices = pieSlices(items, total || items.reduce((sum, item) => sum + item.amount, 0));
  const visibleItems = items.slice(0, 6);
  return (
    <View accessibilityLabel={items.map((item) => `${item.label}, ${item.percent} percent, ${formatReportValue(item.amount, "money", currencyCode, locale)}`).join(". ")} className="gap-4">
      <View className="flex-row items-center gap-4">
        <Svg width={148} height={148} viewBox="0 0 120 120">
          {slices.map((slice) => (
            <Path key={slice.item.key} d={slice.path} fill={slice.item.color} opacity={selected?.key && selected.key !== slice.item.key ? 0.5 : 1} onPress={() => onSelect(slice.item.key)} />
          ))}
        </Svg>
        <View className="min-w-0 flex-1 gap-2">
          <Text className="font-sans text-xs text-text-muted">Total</Text>
          <Text className="font-sans text-xl font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit>{formatReportValue(total, "money", currencyCode, locale)}</Text>
          {selected ? <Text className="font-sans text-xs text-brand-soft" numberOfLines={2}>{selected.label} Â· {selected.percent}%</Text> : null}
        </View>
      </View>
      <View className="gap-2">
        {visibleItems.map((item) => (
          <Pressable accessibilityRole="button" className="flex-row items-center gap-2" key={item.key} onPress={() => onSelect(item.key)}>
            <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>{item.label}</Text>
            <Text className="font-sans text-xs font-semibold text-text tabular-nums">{formatReportValue(item.amount, "money", currencyCode, locale)}</Text>
            <Text className="w-10 text-right font-sans text-xs text-text-muted">{item.percent}%</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Bars({ currencyCode, direction, items, locale, onSelect, selectedKey }: { currencyCode: CurrencyCode; direction: "horizontal" | "vertical"; items: ChartDataItem[]; locale: string; onSelect: (key: string) => void; selectedKey: string | null }) {
  const max = Math.max(1, ...items.map((item) => item.amount));
  if (direction === "vertical") {
    return <View className="gap-3"><View className="h-36 flex-row items-end gap-2 border-b border-surface-border px-1">{items.slice(0, 8).map((item) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.label}, ${formatReportValue(item.amount, "money", currencyCode, locale)}`} className={`min-w-0 flex-1 justify-end ${selectedKey && selectedKey !== item.key ? "opacity-45" : "opacity-100"}`} key={item.key} onPress={() => onSelect(item.key)}><View className="rounded-t-full" style={{ backgroundColor: item.color, height: Math.max(6, (item.amount / max) * 132) }} /></Pressable>)}</View><View className="flex-row gap-2">{items.slice(0, 4).map((item) => <Text className="min-w-0 flex-1 text-center font-sans text-[10px] text-text-muted" key={item.key} numberOfLines={1}>{item.label}</Text>)}</View></View>;
  }
  return <View className="gap-3">{items.slice(0, 8).map((item) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.label}, ${formatReportValue(item.amount, "money", currencyCode, locale)}, ${item.percent} percent`} key={item.key} onPress={() => onSelect(item.key)}><View className="flex-row items-center justify-between gap-3"><Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>{item.label}</Text><Text className="font-sans text-xs font-semibold text-text tabular-nums">{formatReportValue(item.amount, "money", currencyCode, locale)}</Text></View><View className="mt-1 h-3 rounded-full bg-background-muted"><View className={`h-3 rounded-full ${selectedKey && selectedKey !== item.key ? "opacity-45" : "opacity-100"}`} style={{ backgroundColor: item.color, width: `${Math.max(4, (item.amount / max) * 100)}%` }} /></View></Pressable>)}</View>;
}

function pieSlices(items: ChartDataItem[], total: number) {
  const radius = 56;
  const center = 60;
  let currentAngle = -90;
  return items.map((item) => {
    const angle = total > 0 ? (item.amount / total) * 360 : 0;
    const start = pointOnCircle(center, center, radius, currentAngle);
    const end = pointOnCircle(center, center, radius, currentAngle + angle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = [`M ${center} ${center}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`, "Z"].join(" ");
    currentAngle += angle;
    return { item, path };
  });
}

function pointOnCircle(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = (Math.PI / 180) * angleDegrees;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}
