import { useLocalSearchParams } from "expo-router";

import { sharedRoutes } from "@/features/shared/routes";
import { TransactionFormScreen } from "@/features/transactions/TransactionFormScreen";

export default function SharedTransactionEditRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = params.id ? Number(params.id) : null;
  const resolvedId = Number.isFinite(transactionId) ? transactionId : null;

  return (
    <TransactionFormScreen
      returnRoute={resolvedId ? sharedRoutes.transaction(resolvedId) : sharedRoutes.transactions}
      sharedEditMode
      transactionId={resolvedId}
    />
  );
}
