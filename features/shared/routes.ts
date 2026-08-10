export const sharedRoutes = {
  dashboard: "/",
  recordSettlement: "/shared/record-settlement",
  settings: "/shared/settings",
  settlementHistory: "/shared/settlement-history",
  transaction: (transactionId: number | string) => `/shared/transactions/${transactionId}` as const,
  transactionEdit: (transactionId: number | string) => `/shared/transactions/${transactionId}/edit` as const,
  transactions: "/shared/transactions"
} as const;
