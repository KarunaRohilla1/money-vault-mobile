import { useLocalSearchParams } from "expo-router";

import { TransactionFormScreen } from "@/features/transactions/TransactionFormScreen";

export default function EditTransactionRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = params.id ? Number(params.id) : null;

  return <TransactionFormScreen transactionId={Number.isFinite(transactionId) ? transactionId : null} />;
}
