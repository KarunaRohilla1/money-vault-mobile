export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const
  },
  settings: {
    effective: (vaultId: string | null) => ["settings", "effective", vaultId ?? "local-defaults"] as const
  },
  vaults: {
    all: ["vaults"] as const,
    detail: (vaultId: string) => ["vaults", "detail", vaultId] as const
  }
} as const;
