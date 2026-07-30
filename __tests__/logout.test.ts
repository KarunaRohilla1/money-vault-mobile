import * as SecureStore from "expo-secure-store";

import { resetNavigationAfterLogout } from "@/features/settings/logoutNavigation";
import { logoutRow, preferenceRows, preferenceRowsWithLogout } from "@/features/settings/moreModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { logoutBackendSession } from "@/services/api/logout";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

const vault = {
  id: "1",
  isAdmin: true,
  name: "Vault Under Test",
  vaultType: "Individual"
};

function resetState() {
  queryClient.clear();
  useAuthStore.getState().setSignedOut();
  useAccessStore.getState().setAccessState("booting");
  useOnboardingStore.setState({ vaults: {} });
}

describe("logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
  });

  it("renders logout as the final More preference row", () => {
    expect(logoutRow).toMatchObject({
      action: "logout",
      icon: "logout",
      iconTone: "danger",
      title: "Logout"
    });
    expect(preferenceRowsWithLogout).toEqual([...preferenceRows, logoutRow]);
    expect(preferenceRowsWithLogout.at(-1)?.title).toBe("Logout");
  });

  it("logs out by clearing Secure Store, auth state, access state, onboarding scope, and query cache", async () => {
    useAuthStore.getState().setAuthenticated("jwt-token", vault, vault);
    useAccessStore.getState().setAccessState("ready");
    useOnboardingStore.getState().updateDraft("1", { vaultName: "Draft Vault" });
    useOnboardingStore.getState().completeVault("1");
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });

    await logoutBackendSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token");
    expect(useAuthStore.getState()).toMatchObject({
      authenticatedVault: null,
      status: "signed-out",
      token: null,
      vault: null
    });
    expect(useAccessStore.getState().accessState).toBe("signed-out");
    expect(useOnboardingStore.getState().vaults["1"]).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });

  it("does not clear in-memory session or query cache when Secure Store logout fails", async () => {
    useAuthStore.getState().setAuthenticated("jwt-token", vault, vault);
    useAccessStore.getState().setAccessState("ready");
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error("delete failed"));

    await expect(logoutBackendSession()).rejects.toThrow("Secure Store could not complete the token storage operation.");

    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      token: "jwt-token",
      vault
    });
    expect(useAccessStore.getState().accessState).toBe("ready");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toEqual({ stale: true });
  });

  it("resets navigation to sign-in after logout so back navigation cannot return to the app", () => {
    const router = {
      dismissAll: jest.fn(),
      replace: jest.fn()
    };

    resetNavigationAfterLogout(router);

    expect(router.dismissAll).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/sign-in");
  });
});