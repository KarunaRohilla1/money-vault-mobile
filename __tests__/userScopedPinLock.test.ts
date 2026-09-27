import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { changeVaultPin } from "@/features/settings/security/changePin";
import { SECURITY_STORAGE_KEYS } from "@/features/settings/security/constants/security";
import { authenticateWithBiometrics } from "@/features/settings/security/services/biometric.service";
import {
  hasLocalPin,
  storeLocalPin,
  verifyLocalPin
} from "@/features/settings/security/services/pinLock.service";
import { apiClient } from "@/services/api/client";
import { logoutBackendSession } from "@/services/api/logout";
import { loginWithUsernamePin, registerWithUsernamePin } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";

describe("User-scoped PIN verification and App Lock (Scenarios A through I)", () => {
  const store = new Map<string, string>();

  const vaultUser1 = {
    id: "1",
    isAdmin: true,
    name: "User 1 Vault",
    vaultType: "Individual"
  };

  const vaultUser2 = {
    id: "2",
    isAdmin: true,
    name: "User 2 Vault",
    vaultType: "Individual"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    useAuthStore.getState().setSignedOut();

    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => store.get(key) ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      store.set(key, value);
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
      store.delete(key);
    });

    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: true });
  });

  it("Scenario A: Old account → login → lock → unlock", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: vaultUser1,
      pinSet: true,
      token: "jwt-user-1",
      userId: "user-1",
      vault: vaultUser1
    });

    // 1. User 1 logs in with PIN "1234"
    const loginResponse = await loginWithUsernamePin("user_1", "1234");
    useAuthStore.getState().setAuthenticated(loginResponse.token, loginResponse.vault, loginResponse.authenticatedVault, {
      userId: loginResponse.userId ?? null
    });

    expect(await hasLocalPin("user-1")).toBe(true);

    // 2. User 1 unlocks with PIN "1234"
    const unlocked = await verifyLocalPin("1234", "user-1");
    expect(unlocked).toBe(true);
  });

  it("Scenario B: Logout → new account → login → lock → unlock with NEW PIN", async () => {
    // 1. User 1 was logged in
    await storeLocalPin("1234", "user-1");
    useAuthStore.getState().setAuthenticated("jwt-user-1", vaultUser1, vaultUser1, { userId: "user-1" });

    // 2. Logout clears state
    await logoutBackendSession();
    expect(await hasLocalPin("user-1")).toBe(false);

    // 3. User 2 logs in with new PIN "5678"
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: vaultUser2,
      pinSet: true,
      token: "jwt-user-2",
      userId: "user-2",
      vault: vaultUser2
    });

    const loginResponse = await loginWithUsernamePin("user_2", "5678");
    useAuthStore.getState().setAuthenticated(loginResponse.token, loginResponse.vault, loginResponse.authenticatedVault, {
      userId: loginResponse.userId ?? null
    });

    expect(await hasLocalPin("user-2")).toBe(true);

    // 4. User 2 unlocks with new PIN "5678"
    const unlocked = await verifyLocalPin("5678", "user-2");
    expect(unlocked).toBe(true);
  });

  it("Scenario C: Old PIN must NOT unlock new account", async () => {
    // User 2 logs in with PIN "5678"
    await storeLocalPin("5678", "user-2");
    useAuthStore.getState().setAuthenticated("jwt-user-2", vaultUser2, vaultUser2, { userId: "user-2" });

    // Attempting old PIN "1234" fails
    const unlocked = await verifyLocalPin("1234", "user-2");
    expect(unlocked).toBe(false);
  });

  it("Scenario D: New PIN must NOT unlock old account", async () => {
    // User 1 logs in with PIN "1234"
    await storeLocalPin("1234", "user-1");
    useAuthStore.getState().setAuthenticated("jwt-user-1", vaultUser1, vaultUser1, { userId: "user-1" });

    // Attempting new PIN "5678" fails
    const unlocked = await verifyLocalPin("5678", "user-1");
    expect(unlocked).toBe(false);

    // Also: if user ID mismatches entirely, verification returns false
    const mismatchedUserUnlock = await verifyLocalPin("1234", "user-2");
    expect(mismatchedUserUnlock).toBe(false);
  });

  it("Scenario E: Change PIN → new PIN unlocks", async () => {
    await storeLocalPin("1234", "user-1");
    useAuthStore.getState().setAuthenticated("jwt-user-1", vaultUser1, vaultUser1, { userId: "user-1" });

    jest.spyOn(apiClient, "changePin").mockResolvedValueOnce({
      accessibleVaults: [vaultUser1],
      authenticatedVault: vaultUser1,
      pinSet: true,
      userId: "user-1",
      vault: vaultUser1
    });

    await changeVaultPin({
      confirmPin: "9999",
      currentPin: "1234",
      newPin: "9999",
      token: "jwt-user-1"
    });

    expect(await verifyLocalPin("9999", "user-1")).toBe(true);
  });

  it("Scenario F: Change PIN → old PIN fails", async () => {
    await storeLocalPin("1234", "user-1");
    useAuthStore.getState().setAuthenticated("jwt-user-1", vaultUser1, vaultUser1, { userId: "user-1" });

    jest.spyOn(apiClient, "changePin").mockResolvedValueOnce({
      accessibleVaults: [vaultUser1],
      authenticatedVault: vaultUser1,
      pinSet: true,
      userId: "user-1",
      vault: vaultUser1
    });

    await changeVaultPin({
      confirmPin: "9999",
      currentPin: "1234",
      newPin: "9999",
      token: "jwt-user-1"
    });

    expect(await verifyLocalPin("1234", "user-1")).toBe(false);
  });

  it("Scenario G: Logout → local verifier is cleared", async () => {
    await storeLocalPin("1234", "user-1");
    useAuthStore.getState().setAuthenticated("jwt-user-1", vaultUser1, vaultUser1, { userId: "user-1" });

    await logoutBackendSession();

    expect(store.get(SECURITY_STORAGE_KEYS.pinVerifier)).toBeUndefined();
    expect(store.get(SECURITY_STORAGE_KEYS.pinSalt)).toBeUndefined();
    expect(store.get(SECURITY_STORAGE_KEYS.pinUserId)).toBeUndefined();
    expect(await hasLocalPin("user-1")).toBe(false);
  });

  it("Scenario H: Registration & login establish local PIN on a fresh session", async () => {
    jest.spyOn(apiClient, "register").mockResolvedValueOnce({
      authenticatedVault: vaultUser1,
      pinSet: true,
      token: "jwt-fresh-user",
      userId: "fresh-user-1",
      vault: vaultUser1
    });

    const regResponse = await registerWithUsernamePin({
      confirmPin: "4321",
      displayName: "Fresh User",
      pin: "4321",
      username: "fresh_user"
    });

    useAuthStore.getState().setAuthenticated(regResponse.token, regResponse.vault, regResponse.authenticatedVault, {
      userId: regResponse.userId ?? null
    });

    expect(await hasLocalPin("fresh-user-1")).toBe(true);
    expect(await verifyLocalPin("4321", "fresh-user-1")).toBe(true);
  });

  it("Scenario I: Biometric unlock continues to work independently", async () => {
    const authResult = await authenticateWithBiometrics("Unlock Money Vault");
    expect(authResult.status).toBe("success");
  });

  it("Scenario J: When user selects Not Now (biometricDisabled), biometric is not enabled and PIN unlock works", async () => {
    // Biometric is not enabled in SecureStore
    expect(store.get(SECURITY_STORAGE_KEYS.biometricEnabled)).toBeUndefined();

    // User logs in and has a PIN
    await storeLocalPin("1234", "user-karuna");
    useAuthStore.getState().setAuthenticated("jwt-karuna", vaultUser1, vaultUser1, {
      displayName: "Karuna",
      userId: "user-karuna"
    });

    const { isBiometricUnlockEnabled } = await import("@/features/settings/security/services/appLock.service");
    expect(await isBiometricUnlockEnabled()).toBe(false);

    // PIN unlock succeeds
    expect(await hasLocalPin("user-karuna")).toBe(true);
    expect(await verifyLocalPin("1234", "user-karuna")).toBe(true);
  });

  it("Scenario K: Display Name is preserved in authStore upon login and session restore", async () => {
    // 1. Login with username + PIN
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: vaultUser1,
      displayName: "Karuna",
      pinSet: true,
      token: "jwt-token-karuna",
      userId: "user-karuna",
      vault: { ...vaultUser1, name: "Personal" }
    });

    const loginResponse = await loginWithUsernamePin("karuna123", "1234");
    useAuthStore.getState().setAuthenticated(loginResponse.token, loginResponse.vault, loginResponse.authenticatedVault, {
      displayName: loginResponse.displayName ?? null,
      userId: loginResponse.userId ?? null
    });

    expect(useAuthStore.getState().displayName).toBe("Karuna");
    expect(useAuthStore.getState().vault?.name).toBe("Personal");

    // 2. Session restore
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => {
      if (key === "money_vault_backend_auth_token") return "jwt-token-karuna";
      return store.get(key) ?? null;
    });

    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [{ ...vaultUser1, name: "Personal" }],
      authenticatedVault: { ...vaultUser1, name: "Personal" },
      displayName: "Karuna",
      pinSet: true,
      userId: "user-karuna",
      vault: { ...vaultUser1, name: "Personal" }
    });

    const { restoreBackendSession, sessionExtras } = await import("@/services/api/session");
    const restored = await restoreBackendSession();
    expect(restored?.displayName).toBe("Karuna");
    expect(restored?.vault?.name).toBe("Personal");

    if (restored && restored.vault) {
      useAuthStore.getState().setAuthenticated(restored.token, restored.vault, restored.authenticatedVault, sessionExtras(restored));
    }

    expect(useAuthStore.getState().displayName).toBe("Karuna");
  });
});

