import { queryClient } from "@/lib/queryClient";
import { clearStoredAuthToken } from "@/services/api/tokenStorage";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

function uniqueVaultIds(ids: (string | null | undefined)[]) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

export async function logoutBackendSession(): Promise<void> {
  const authState = useAuthStore.getState();
  const scopedVaultIds = uniqueVaultIds([authState.vault?.id, authState.authenticatedVault?.id]);

  await clearStoredAuthToken();

  queryClient.clear();
  useOnboardingStore.getState().resetVaults(scopedVaultIds);
  useAuthStore.getState().setSignedOut();
  useAccessStore.getState().setAccessState("signed-out");
}