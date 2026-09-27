import { restorePersonalVaultAfterUnlock } from "@/features/settings/security/services/unlockSession.service";
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/stores/authStore";

const personalVault = {
  id: "1",
  isAdmin: true,
  name: "Personal Vault",
  vaultType: "Individual" as const
};

const sharedVault = {
  id: "2",
  isAdmin: true,
  name: "Shared Vault",
  vaultType: "Shared" as const
};

describe("restorePersonalVaultAfterUnlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSignedOut();
  });

  it("does nothing when already on Personal Vault", async () => {
    useAuthStore.getState().setAuthenticated("jwt-token", personalVault, personalVault, {
      pinSet: true,
      userId: "user-1"
    });
    const activateSpy = jest.spyOn(apiClient, "activatePersonalVault");

    await restorePersonalVaultAfterUnlock();

    expect(activateSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().vault?.vaultType).toBe("Individual");
  });

  it("switches from Shared Vault to Personal Vault after unlock", async () => {
    useAuthStore.getState().setAuthenticated("shared-jwt", sharedVault, personalVault, {
      displayName: "Karuna",
      pinSet: true,
      userId: "user-1"
    });
    jest.spyOn(apiClient, "activatePersonalVault").mockResolvedValueOnce({
      authenticatedVault: personalVault,
      pinSet: true,
      token: "personal-jwt",
      userId: "user-1",
      vault: personalVault
    });

    await restorePersonalVaultAfterUnlock();

    expect(apiClient.activatePersonalVault).toHaveBeenCalledWith("shared-jwt");
    expect(useAuthStore.getState()).toMatchObject({
      displayName: "Karuna",
      status: "authenticated",
      token: "personal-jwt",
      vault: personalVault
    });
  });
});
