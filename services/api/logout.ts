import { clearLocalPin } from "@/features/settings/security/services/pinLock.service";
import { queryClient } from "@/lib/queryClient";
import { clearStoredAuthToken } from "@/services/api/tokenStorage";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useRecoveryCodeStore } from "@/stores/recoveryCodeStore";

export async function logoutBackendSession(): Promise<void> {
  await clearStoredAuthToken();
  await clearLocalPin();

  queryClient.clear();
  // Keep local onboarding completion markers. Backend setup status is the source of
  // truth; local completion is only a fallback if the setup check cannot reach the API.
  useRecoveryCodeStore.getState().clearPendingCode();
  useAuthStore.getState().setSignedOut();
  useAccessStore.getState().setAccessState("signed-out");
}

