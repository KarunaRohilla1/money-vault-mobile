const GENERIC_PERSONAL_VAULT_NAMES = new Set(["personal", "personal vault"]);

function isSharedVaultType(vault: { vaultType: string } | null | undefined) {
  return vault?.vaultType === "Shared";
}

/** True when a vault name is the default Personal Vault label, not a person name. */
export function isGenericPersonalVaultName(name: string | null | undefined) {
  return GENERIC_PERSONAL_VAULT_NAMES.has((name ?? "").trim().toLowerCase());
}

/** Person-facing label: prefer profile display name; never use the Personal vault type/name. */
export function personDisplayName(
  displayName: string | null | undefined,
  fallbackName?: string | null,
  emptyFallback = "there"
) {
  const preferred = displayName?.trim();
  if (preferred) {
    return preferred;
  }

  const fallback = fallbackName?.trim();
  if (fallback && !isGenericPersonalVaultName(fallback)) {
    return fallback;
  }

  return emptyFallback;
}

/** Vault-kind label for UI (Personal Vault / Shared Vault), not a person name. */
export function vaultKindLabel(vault: { name?: string; vaultType: string } | null | undefined) {
  if (!vault) {
    return "Vault";
  }

  if (isSharedVaultType(vault)) {
    return vault.name?.trim() || "Shared Vault";
  }

  return "Personal Vault";
}

/** Title for the More menu vault card. */
export function vaultCardTitle(
  vault: { name: string; vaultType: string },
  displayName?: string | null
) {
  if (isSharedVaultType(vault)) {
    return vault.name.trim() || "Shared Vault";
  }

  return personDisplayName(displayName, null, "My Vault");
}
