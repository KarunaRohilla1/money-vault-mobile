import { Text } from "react-native";

import { compactInsightLine, type ActivityMetrics } from "@/features/planning/activityPresentation";

interface ActivityInsightLineProps {
  currencyCode: string;
  locale: string;
  metrics: ActivityMetrics;
}

export function ActivityInsightLine({ currencyCode, locale, metrics }: ActivityInsightLineProps) {
  return <Text className="font-sans text-sm text-text-muted">{compactInsightLine(metrics, currencyCode, locale)}</Text>;
}
