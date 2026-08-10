import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import {
  autoLockLabel,
  DEFAULT_AUTO_LOCK_TIMEOUT,
  parseAutoLockTimeout,
  SECURITY_STORAGE_KEYS
} from "@/features/settings/security/constants/security";
import {
  authenticateWithBiometrics,
  isBiometricSupported
} from "@/features/settings/security/services/biometric.service";
import {
  deleteSecureItem,
  getSecureItem,
  SecureStorageError,
  setSecureItem
} from "@/features/settings/security/services/secureStorage.service";

describe("security constants", () => {
  it("parses known auto-lock timeouts and falls back to the default", () => {
    expect(parseAutoLockTimeout("1m")).toBe("1m");
    expect(parseAutoLockTimeout("invalid")).toBe(DEFAULT_AUTO_LOCK_TIMEOUT);
    expect(parseAutoLockTimeout(null)).toBe(DEFAULT_AUTO_LOCK_TIMEOUT);
    expect(autoLockLabel("5m")).toBe("5 minutes");
  });
});

describe("secureStorage.service", () => {
  beforeEach(() => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
  });

  it("reads, writes, and deletes secure items", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("true");

    await expect(getSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled)).resolves.toBe("true");
    await setSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled, "true");
    await deleteSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(SECURITY_STORAGE_KEYS.biometricEnabled, "true");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURITY_STORAGE_KEYS.biometricEnabled);
  });

  it("throws when Secure Store is unavailable", async () => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(getSecureItem(SECURITY_STORAGE_KEYS.autoLockTimeout)).rejects.toBeInstanceOf(SecureStorageError);
  });
});

describe("biometric.service", () => {
  beforeEach(() => {
    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: true });
  });

  it("reports unsupported devices when hardware or enrollment is missing", async () => {
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValueOnce(false);
    await expect(isBiometricSupported()).resolves.toBe(false);
  });

  it("authenticates successfully when biometrics are available", async () => {
    await expect(authenticateWithBiometrics()).resolves.toEqual({ status: "success" });
  });

  it("maps user cancellation", async () => {
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValueOnce({
      error: "user_cancel",
      success: false
    });

    await expect(authenticateWithBiometrics()).resolves.toMatchObject({ status: "cancelled" });
  });
});
