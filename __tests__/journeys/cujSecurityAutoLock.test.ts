import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_AUTO_LOCK_TIMEOUT,
  SECURITY_STORAGE_KEYS
} from "@/features/settings/security/constants/security";
import {
  getStoredAutoLockTimeout,
  isBiometricUnlockEnabled,
  shouldLockAfterBackground
} from "@/features/settings/security/services/appLock.service";
import {
  authenticateWithBiometrics,
  isBiometricSupported
} from "@/features/settings/security/services/biometric.service";
import {
  SecureStorageError,
  setSecureItem
} from "@/features/settings/security/services/secureStorage.service";
import { useAppLockStore } from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";

describe("CUJ 7 — Security biometrics, auto-lock, and unlock", () => {
  const secureStorage = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    secureStorage.clear();
    useAppLockStore.getState().setLocked(false);
    useAuthStore.getState().setSignedOut();

    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => secureStorage.get(key) ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key: string, value: string) => {
      secureStorage.set(key, value);
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
      secureStorage.delete(key);
    });
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);

    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: true });
  });

  it("enables biometrics, locks after background timeout, then unlocks back to the app", async () => {
    useAuthStore.getState().setAuthenticated("jwt", {
      id: "1",
      isAdmin: true,
      name: "Personal",
      vaultType: "Individual"
    });

    expect(await isBiometricSupported()).toBe(true);

    // Enable biometrics (same gate as Security screen enable flow).
    const enrolled = await authenticateWithBiometrics();
    expect(enrolled.status).toBe("success");
    await setSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled, "true");
    await setSecureItem(SECURITY_STORAGE_KEYS.autoLockTimeout, "1m");

    expect(await isBiometricUnlockEnabled()).toBe(true);
    expect(await getStoredAutoLockTimeout()).toBe("1m");

    // Cold start / enable → lock overlay when authenticated + biometrics on.
    useAppLockStore.getState().setLocked(true);
    expect(useAppLockStore.getState().locked).toBe(true);

    // Background long enough to require lock on resume.
    const now = 2_000_000;
    expect(
      shouldLockAfterBackground({
        backgroundedAt: now - 61_000,
        biometricEnabled: true,
        now,
        timeout: "1m"
      })
    ).toBe(true);

    useAppLockStore.getState().setLocked(true);

    // Fingerprint prompt succeeds → dashboard accessible again.
    const unlock = await authenticateWithBiometrics();
    expect(unlock.status).toBe("success");
    useAppLockStore.getState().setLocked(false);
    expect(useAppLockStore.getState().locked).toBe(false);
  });

  it("does not auto-lock when biometrics are unavailable or Secure Store fails closed", async () => {
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValueOnce(false);
    expect(await isBiometricSupported()).toBe(false);

    expect(
      shouldLockAfterBackground({
        backgroundedAt: Date.now() - 60_000,
        biometricEnabled: false,
        timeout: DEFAULT_AUTO_LOCK_TIMEOUT
      })
    ).toBe(false);

    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);
    await expect(setSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled, "true")).rejects.toBeInstanceOf(SecureStorageError);
    expect(await isBiometricUnlockEnabled()).toBe(false);
  });

  it("locks immediately on background when timeout is immediately", () => {
    expect(
      shouldLockAfterBackground({
        backgroundedAt: Date.now(),
        biometricEnabled: true,
        timeout: "immediately"
      })
    ).toBe(true);
  });
});
