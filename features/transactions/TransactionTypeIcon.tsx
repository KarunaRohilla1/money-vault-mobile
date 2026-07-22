import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { transactionIconName } from "@/features/transactions/transactionIconModel";
import type { TransactionHistoryItemApi } from "@/services/api/types";
import { theme } from "@/theme";

type TransactionIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function TransactionTypeIcon({ item }: { item: Pick<TransactionHistoryItemApi, "category" | "title" | "transactionType" | "type"> }) {
  return (
    <View className="h-11 w-11 items-center justify-center rounded-full border border-surface-border bg-surface-raised">
      <MaterialCommunityIcons name={transactionIconName(item) as TransactionIconName} size={20} color={theme.colors.brand.soft} />
    </View>
  );
}
