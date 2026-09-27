export const queryKeys = {
  accounts: {
    byVault: (vaultId: string | null) => ["accounts", "byVault", vaultId ?? "anonymous"] as const,
    root: ["accounts"] as const
  },
  auth: {
    session: ["auth", "session"] as const
  },
  capture: {
    inbox: (vaultId: string | null) => ["capture", "inbox", vaultId ?? "anonymous"] as const,
    root: ["capture"] as const
  },
  categories: {
    byVault: (vaultId: string | null) => ["categories", "byVault", vaultId ?? "anonymous"] as const,
    root: ["categories"] as const
  },
  dashboard: {
    current: (vaultId: string | null) => ["dashboard", "current", vaultId ?? "anonymous"] as const,
    root: ["dashboard"] as const
  },
  planning: {
    cycles: (vaultId: string | null, year?: number | null, status?: string | null) =>
      ["planning", "cycles", vaultId ?? "anonymous", year ?? "current-year", status ?? "all"] as const,
    current: (vaultId: string | null) => ["planning", "detail", vaultId ?? "anonymous", "current"] as const,
    detail: (vaultId: string | null, cycleStart?: string | null) =>
      ["planning", "detail", vaultId ?? "anonymous", cycleStart ?? "current"] as const,
    root: ["planning"] as const
  },
  reports: {
    spending: (vaultId: string | null, filtersKey = "default") => ["reports", "spending", vaultId ?? "anonymous", filtersKey] as const,
    summary: (vaultId: string | null, filters: { cycleStart?: string | undefined }) =>
      ["reports", "summary", vaultId ?? "anonymous", filters.cycleStart ?? "current"] as const,
    shared: (vaultId: string | null, filters: { cycleStart?: string | undefined }) =>
      ["reports", "shared", vaultId ?? "anonymous", filters.cycleStart ?? "current"] as const,
    current: (vaultId: string | null) => ["reports", "summary", vaultId ?? "anonymous", "current"] as const,
    root: ["reports"] as const
  },
  settings: {
    effective: (vaultId: string | null) => ["settings", "effective", vaultId ?? "local-defaults"] as const
  },
  shared: {
    bills: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "bills", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    dashboard: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "dashboard", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    expenses: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "expenses", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    settlementHistory: (
      vaultId: string | null,
      sharedVaultId: number | null = null,
      filtersKey = "all"
    ) => ["shared", "settlementHistory", vaultId ?? "anonymous", sharedVaultId ?? "default", filtersKey] as const,
    settlements: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "settlements", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    root: ["shared"] as const
  },
  transactions: {
    all: (vaultId: string | null) => ["transactions", "all", vaultId ?? "anonymous"] as const,
    detail: (vaultId: string | null, transactionId: number | string) =>
      ["transactions", "detail", vaultId ?? "anonymous", String(transactionId)] as const,
    list: (vaultId: string | null, filtersKey = "default") => ["transactions", "list", vaultId ?? "anonymous", filtersKey] as const,
    month: (vaultId: string | null, month: string) => ["transactions", "month", vaultId ?? "anonymous", month] as const,
    monthRange: (vaultId: string | null) => ["transactions", "monthRange", vaultId ?? "anonymous"] as const,
    root: ["transactions"] as const,
    search: (vaultId: string | null, search: string) => ["transactions", "search", vaultId ?? "anonymous", search] as const,
    type: (vaultId: string | null, transactionType: string) => ["transactions", "type", vaultId ?? "anonymous", transactionType] as const
  },
  transfers: {
    all: ["transfers"] as const,
    byVault: (vaultId: string | null) => ["transfers", vaultId ?? "anonymous"] as const,
    detail: (vaultId: string | null, transferGroupId: string) =>
      ["transfers", vaultId ?? "anonymous", "detail", transferGroupId] as const,
    list: (vaultId: string | null, filtersKey = "default") => ["transfers", vaultId ?? "anonymous", "list", filtersKey] as const,
    lists: (vaultId: string | null) => ["transfers", vaultId ?? "anonymous", "list"] as const,
    root: ["transfers"] as const
  },
  vaults: {
    all: ["vaults"] as const,
    detail: (vaultId: string) => ["vaults", "detail", vaultId] as const,
    shared: ["vaults", "shared"] as const,
    sharedDetail: (vaultId: string | number | null) => ["vaults", "shared", "detail", vaultId == null ? "none" : String(vaultId)] as const
  },
  wishlist: {
    current: (vaultId: string | null) => ["wishlist", "current", vaultId ?? "anonymous"] as const,
    root: ["wishlist"] as const
  }
} as const;
