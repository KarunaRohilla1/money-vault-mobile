export const queryKeys = {
  accounts: {
    byVault: (vaultId: string | null) => ["accounts", "byVault", vaultId ?? "anonymous"] as const,
    root: ["accounts"] as const
  },
  auth: {
    session: ["auth", "session"] as const
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
    current: (vaultId: string | null) => ["planning", "current", vaultId ?? "anonymous"] as const,
    root: ["planning"] as const
  },
  reports: {
    current: (vaultId: string | null) => ["reports", "current", vaultId ?? "anonymous"] as const,
    root: ["reports"] as const
  },
  settings: {
    effective: (vaultId: string | null) => ["settings", "effective", vaultId ?? "local-defaults"] as const
  },
  shared: {
    bills: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "bills", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    expenses: (vaultId: string | null, sharedVaultId: number | null = null) =>
      ["shared", "expenses", vaultId ?? "anonymous", sharedVaultId ?? "default"] as const,
    root: ["shared"] as const
  },
  transactions: {
    list: (vaultId: string | null, filtersKey = "default") => ["transactions", "list", vaultId ?? "anonymous", filtersKey] as const,
    root: ["transactions"] as const
  },
  transfers: {
    byVault: (vaultId: string | null) => ["transfers", "byVault", vaultId ?? "anonymous"] as const,
    root: ["transfers"] as const
  },
  vaults: {
    all: ["vaults"] as const,
    detail: (vaultId: string) => ["vaults", "detail", vaultId] as const
  },
  wishlist: {
    current: (vaultId: string | null) => ["wishlist", "current", vaultId ?? "anonymous"] as const,
    root: ["wishlist"] as const
  }
} as const;
