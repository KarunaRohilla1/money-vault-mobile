import { useLocalSearchParams } from "expo-router";

import { TransactionDetailScreen } from "@/features/transactions/TransactionDetailScreen";

export default function TransactionDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = params.id ? Number(params.id) : null;

  return <TransactionDetailScreen transactionId={Number.isFinite(transactionId) ? transactionId : null} />;
}
