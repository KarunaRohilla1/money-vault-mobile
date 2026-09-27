import * as SecureStore from "expo-secure-store";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient, ApiClientError } from "@/services/api/client";
import {
  activatePersonalVaultSession,
  activateSharedVaultSession,
  clearBackendSession,
  establishApiSession,
  loginWithUsernamePin,
  recoverPin,
  restoreBackendSession
} from "@/services/api/session";

const vault = {
  id: "1",
  isAdmin: true,
  name: "Vault Under Test",
  vaultType: "Individual"
};
const sharedVault = {
  id: "2",
  isAdmin: false,
  name: "Shared Vault",
  vaultType: "Shared"
};

describe("backend session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("stores the access token and a local PIN verifier after username login", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: vault,
      pinSet: true,
      token: "jwt-token",
      vault,
      userId: "user-1"
    });

    const response = await loginWithUsernamePin("karuna_1", "1234");

    expect(response.token).toBe("jwt-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "jwt-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("security.pinVerifier", expect.any(String));
  });

  it("stores the new PIN securely after signed-out recovery", async () => {
    jest.spyOn(apiClient, "recoverPin").mockResolvedValueOnce({
      authenticatedVault: vault,
      pinSet: true,
      token: "recovered-jwt",
      userId: "user-1",
      vault
    });

    const response = await recoverPin({
      confirmPin: "5678",
      newPin: "5678",
      recoveryCode: "ABCD-EFGH-IJKL",
      username: "karuna_1"
    });

    expect(response.token).toBe("recovered-jwt");
    expect(response.vault.vaultType).toBe("Individual");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "recovered-jwt");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("security.pinVerifier", expect.any(String));
  });

  it("stores the access token after establishing an API session", async () => {
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault],
      authenticatedVault: vault,
      vault
    });

    const session = await establishApiSession("jwt-token");

    expect(session.token).toBe("jwt-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "jwt-token");
  });

  it("removes stale Dashboard cache when establishing a session", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("old-vault"), { stale: true });
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault],
      authenticatedVault: vault,
      vault
    });

    await establishApiSession("jwt-token");

    expect(queryClient.getQueryData(queryKeys.dashboard.current("old-vault"))).toBeUndefined();
  });

  it("does not store a token when the access token is missing", async () => {
    await expect(establishApiSession("")).rejects.toMatchObject({
      code: "TOKEN_MISSING",
      stage: "TOKEN_VALIDATED"
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("reports the Secure Store stage when token persistence fails", async () => {
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error("Secure Store unavailable"));

    await expect(establishApiSession("jwt-token")).rejects.toMatchObject({
      code: "SECURE_STORE_WRITE_FAILED",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
  });

  it("reports Secure Store unavailable distinctly when the runtime does not provide it", async () => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(establishApiSession("jwt-token")).rejects.toMatchObject({
      code: "SECURE_STORE_UNAVAILABLE",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("restores a valid token and switches Shared active vault back to Personal", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      vault: sharedVault
    });
    jest.spyOn(apiClient, "activatePersonalVault").mockResolvedValueOnce({
      authenticatedVault: vault,
      token: "personal-jwt-token",
      vault
    });

    await expect(restoreBackendSession()).resolves.toEqual({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      displayName: null,
      pinSet: false,
      token: "personal-jwt-token",
      userId: null,
      vault
    });
    expect(apiClient.activatePersonalVault).toHaveBeenCalledWith("jwt-token");
  });

  it("restores a Personal Vault session without switching", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      vault
    });
    const activateSpy = jest.spyOn(apiClient, "activatePersonalVault");

    await expect(restoreBackendSession()).resolves.toEqual({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      displayName: null,
      pinSet: false,
      token: "jwt-token",
      userId: null,
      vault
    });
    expect(activateSpy).not.toHaveBeenCalled();
  });

  it("clears a stored token when dashboard validation returns 401", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockRejectedValueOnce(
      new ApiClientError("Invalid authentication token.", {
        isNetworkError: false,
        status: 401
      })
    );

    await expect(restoreBackendSession()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });

  it("preserves a stored token when restore fails due to network error", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockRejectedValueOnce(
      new ApiClientError("Network unavailable.", {
        isNetworkError: true,
        status: null
      })
    );

    await expect(restoreBackendSession()).rejects.toThrow("Network unavailable.");
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("preserves a stored token when restore fails with a 5xx response", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockRejectedValueOnce(
      new ApiClientError("Server unavailable.", {
        isNetworkError: false,
        status: 503
      })
    );

    await expect(restoreBackendSession()).rejects.toThrow("Server unavailable.");
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("clears token and Dashboard cache when signing out", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });

    await clearBackendSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });

  it("stores replacement token and clears stale cache when activating a shared vault without another PIN prompt", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });
    const activateSharedVault = jest.spyOn(apiClient, "activateSharedVault").mockResolvedValueOnce({
      authenticatedVault: vault,
      token: "shared-jwt-token",
      vault: sharedVault
    });

    await expect(activateSharedVaultSession("personal-jwt-token", { sharedVaultId: 2 })).resolves.toMatchObject({
      token: "shared-jwt-token",
      vault: sharedVault,
      authenticatedVault: vault
    });

    expect(activateSharedVault).toHaveBeenCalledWith("personal-jwt-token", { sharedVaultId: 2 });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "shared-jwt-token");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });

  it("stores replacement token when returning to the personal vault without a PIN", async () => {
    jest.spyOn(apiClient, "activatePersonalVault").mockResolvedValueOnce({
      authenticatedVault: vault,
      token: "personal-jwt-token",
      vault
    });

    await expect(activatePersonalVaultSession("shared-jwt-token")).resolves.toMatchObject({
      token: "personal-jwt-token",
      vault,
      authenticatedVault: vault
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "personal-jwt-token");
  });
});
