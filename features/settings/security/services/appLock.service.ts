import {
  DEFAULT_AUTO_LOCK_TIMEOUT,
  parseAutoLockTimeout,
  SECURITY_STORAGE_KEYS,
  type AutoLockTimeout
} from "@/features/settings/security/constants/security";
import { getSecureItem } from "@/features/settings/security/services/secureStorage.service";

/** App Lock is enabled only when biometric unlock is opted-in for this user. */
export async function isBiometricUnlockEnabled(userId?: string | null) {
  try {
    const value = await getSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled);
    if (value !== "true") {
      return false;
    }

    const storedUserId = await getSecureItem(SECURITY_STORAGE_KEYS.biometricUserId);
    if (userId) {
      return storedUserId === userId;
    }

    return true;
  } catch {
    return false;
  }
}

export async function isAppLockEnabled(userId?: string | null) {
  return isBiometricUnlockEnabled(userId);
}

export async function getStoredAutoLockTimeout(): Promise<AutoLockTimeout> {
  try {
    const value = await getSecureItem(SECURITY_STORAGE_KEYS.autoLockTimeout);
    return parseAutoLockTimeout(value);
  } catch {
    return DEFAULT_AUTO_LOCK_TIMEOUT;
  }
}

/** Milliseconds of background time before re-lock. `null` means never auto-lock on resume. */
export function autoLockTimeoutMs(timeout: AutoLockTimeout): number | null {
  switch (timeout) {
    case "immediately":
      return 0;
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "never":
      return null;
  }
}

export function shouldLockAfterBackground(input: {
  backgroundedAt: number | null;
  biometricEnabled: boolean;
  now?: number;
  timeout: AutoLockTimeout;
}) {
  if (!input.biometricEnabled) {
    return false;
  }

  const maxIdleMs = autoLockTimeoutMs(input.timeout);
  if (maxIdleMs === null) {
    return false;
  }

  if (input.backgroundedAt === null) {
    return maxIdleMs === 0;
  }

  const now = input.now ?? Date.now();
  return now - input.backgroundedAt >= maxIdleMs;
}
