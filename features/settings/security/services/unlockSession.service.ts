import { isSharedVault } from "@/lib/vaultNavigation";
import { activatePersonalVaultSession, sessionExtras } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";

/** After App Lock unlock, always land on the Personal Vault (never Shared). */
export async function restorePersonalVaultAfterUnlock(): Promise<void> {
  const auth = useAuthStore.getState();
  const token = auth.token;

  if (!token) {
    return;
  }

  if (!isSharedVault(auth.vault)) {
    return;
  }

  const response = await activatePersonalVaultSession(token);
  auth.setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
}
