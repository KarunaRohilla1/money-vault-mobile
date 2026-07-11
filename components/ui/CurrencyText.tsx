import { Text } from "react-native";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

interface CurrencyTextProps {
  value: number;
  currencyCode: string;
  locale?: string;
  className?: string;
}

export function CurrencyText({ value, currencyCode, locale, className }: CurrencyTextProps) {
  return <Text className={cn("font-sans tabular-nums text-text", className)}>{formatCurrency(value, currencyCode, locale)}</Text>;
}
