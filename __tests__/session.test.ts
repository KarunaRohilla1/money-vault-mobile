import * as SecureStore from "expo-secure-store";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient, ApiClientError } from "@/services/api/client";
import {
  activatePersonalVaultSession,
  activateSharedVaultSession,
  clearBackendSession,
  loginWithVaultCredentials,
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

  it("stores the backend JWT in Secure Store after successful login", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });

    const response = await loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" });

    expect(response.token).toBe("jwt-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "jwt-token");
  });

  it("removes stale Dashboard cache when logging into a vault", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("old-vault"), { stale: true });
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });

    await loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" });

    expect(queryClient.getQueryData(queryKeys.dashboard.current("old-vault"))).toBeUndefined();
  });

  it("does not store a token after failed login", async () => {
    jest.spyOn(apiClient, "login").mockRejectedValueOnce(
      new ApiClientError("Invalid vault credentials.", {
        code: "INVALID_CREDENTIALS",
        isNetworkError: false,
        status: 401
      })
    );

    await expect(loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" })).rejects.toThrow("Invalid vault credentials.");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("does not store a token when a 200 login response is incomplete", async () => {
    jest.spyOn(apiClient, "login").mockRejectedValueOnce(
      new ApiClientError("The login response was incomplete.", {
        code: "LOGIN_RESPONSE_INVALID",
        isNetworkError: false,
        status: null
      })
    );

    await expect(loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" })).rejects.toThrow("The login response was incomplete.");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("reports the token validation stage when a normalized login response has no token", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "",
      vault
    });

    await expect(loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" })).rejects.toMatchObject({
      code: "TOKEN_MISSING",
      stage: "TOKEN_VALIDATED"
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("reports the Secure Store stage when token persistence fails after login", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error("Secure Store unavailable"));

    const promise = loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" });

    await expect(promise).rejects.toMatchObject({
      code: "SECURE_STORE_WRITE_FAILED",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
  });

  it("reports Secure Store unavailable distinctly when the runtime does not provide it", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);

    const promise = loginWithVaultCredentials({ pin: "0012", vaultName: "Vault Under Test" });

    await expect(promise).rejects.toMatchObject({
      code: "SECURE_STORE_UNAVAILABLE",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("restores a valid token by validating against the backend session endpoint", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      vault: sharedVault
    });

    await expect(restoreBackendSession()).resolves.toEqual({
      accessibleVaults: [vault, sharedVault],
      authenticatedVault: vault,
      token: "jwt-token",
      vault: sharedVault
    });
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

  it("stores replacement token and clears stale cache when activating a shared vault", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });
    jest.spyOn(apiClient, "activateSharedVault").mockResolvedValueOnce({
      authenticatedVault: vault,
      token: "shared-jwt-token",
      vault: sharedVault
    });

    await expect(activateSharedVaultSession("personal-jwt-token", { pin: "0123", sharedVaultId: 2 })).resolves.toMatchObject({
      token: "shared-jwt-token",
      vault: sharedVault,
      authenticatedVault: vault
    });

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
