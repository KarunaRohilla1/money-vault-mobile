import { SECURITY_STORAGE_KEYS } from "@/features/settings/security/constants/security";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/features/settings/security/services/secureStorage.service";
import { useAuthStore } from "@/stores/authStore";

async function sha256(value: string) {
  const Crypto = await import("expo-crypto");
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function randomSalt() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function resolveUserId(userId?: string | null): string | null {
  if (typeof userId === "string" && userId.length > 0) {
    return userId;
  }
  return useAuthStore.getState().userId ?? null;
}

export async function storeLocalPin(pin: string, userId?: string | null) {
  const effectiveUserId = resolveUserId(userId);
  const salt = randomSalt();
  const hash = await sha256(`${salt}:${pin}`);
  await setSecureItem(SECURITY_STORAGE_KEYS.pinSalt, salt);
  await setSecureItem(SECURITY_STORAGE_KEYS.pinVerifier, hash);
  if (effectiveUserId) {
    await setSecureItem(SECURITY_STORAGE_KEYS.pinUserId, effectiveUserId);
  } else {
    try {
      await deleteSecureItem(SECURITY_STORAGE_KEYS.pinUserId);
    } catch {
      // Ignore when key doesn't exist
    }
  }
}

export async function clearLocalPin() {
  try {
    await deleteSecureItem(SECURITY_STORAGE_KEYS.pinSalt);
  } catch {
    // Ignore when key doesn't exist
  }
  try {
    await deleteSecureItem(SECURITY_STORAGE_KEYS.pinVerifier);
  } catch {
    // Ignore when key doesn't exist
  }
  try {
    await deleteSecureItem(SECURITY_STORAGE_KEYS.pinUserId);
  } catch {
    // Ignore when key doesn't exist
  }
}

export async function hasLocalPin(userId?: string | null) {
  const verifier = await getSecureItem(SECURITY_STORAGE_KEYS.pinVerifier);
  if (!verifier) {
    return false;
  }

  const effectiveUserId = resolveUserId(userId);
  if (effectiveUserId) {
    const storedUserId = await getSecureItem(SECURITY_STORAGE_KEYS.pinUserId);
    if (storedUserId && storedUserId !== effectiveUserId) {
      return false;
    }
  }

  return true;
}

export async function verifyLocalPin(pin: string, userId?: string | null) {
  const isAvailable = await hasLocalPin(userId);
  if (!isAvailable) {
    return false;
  }

  const salt = await getSecureItem(SECURITY_STORAGE_KEYS.pinSalt);
  const verifier = await getSecureItem(SECURITY_STORAGE_KEYS.pinVerifier);

  if (!salt || !verifier) {
    return false;
  }

  return (await sha256(`${salt}:${pin}`)) === verifier;
}

