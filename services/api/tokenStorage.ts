import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "money_vault_backend_auth_token";
const TOKEN_STORAGE_PROBE_KEY = "money_vault_secure_store_probe";
const TOKEN_STORAGE_PROBE_VALUE = "ok";

export type TokenStorageErrorCode =
  | "SECURE_STORE_DELETE_FAILED"
  | "SECURE_STORE_READ_FAILED"
  | "SECURE_STORE_UNAVAILABLE"
  | "SECURE_STORE_WRITE_FAILED";

export class TokenStorageError extends Error {
  public readonly cause: unknown;
  public readonly code: TokenStorageErrorCode;

  public constructor(message: string, code: TokenStorageErrorCode, cause?: unknown) {
    super(message);
    this.name = "TokenStorageError";
    this.cause = cause;
    this.code = code;
  }
}

function logSecureStoreException(error: unknown) {
  if (typeof __DEV__ === "undefined" || !__DEV__) {
    return;
  }

  const errorClass = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : "Non-error thrown";

  console.warn("[SecureStore]", {
    errorClass,
    message
  });
}

async function ensureSecureStoreAvailable() {
  const isAvailable = await SecureStore.isAvailableAsync().catch((error: unknown) => {
    logSecureStoreException(error);
    return false;
  });

  if (!isAvailable) {
    throw new TokenStorageError(
      "Secure Store is unavailable in this runtime. Rebuild the development client after installing expo-secure-store.",
      "SECURE_STORE_UNAVAILABLE"
    );
  }
}

function normalizeStorageError(error: unknown, code: TokenStorageErrorCode) {
  logSecureStoreException(error);

  if (error instanceof TokenStorageError) {
    return error;
  }

  return new TokenStorageError("Secure Store could not complete the token storage operation.", code, error);
}

export async function verifyTokenStorage(): Promise<void> {
  try {
    await ensureSecureStoreAvailable();
    await SecureStore.setItemAsync(TOKEN_STORAGE_PROBE_KEY, TOKEN_STORAGE_PROBE_VALUE);
    const value = await SecureStore.getItemAsync(TOKEN_STORAGE_PROBE_KEY);

    if (value !== TOKEN_STORAGE_PROBE_VALUE) {
      throw new TokenStorageError("Secure Store probe returned an unexpected value.", "SECURE_STORE_READ_FAILED");
    }

    await SecureStore.deleteItemAsync(TOKEN_STORAGE_PROBE_KEY);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_WRITE_FAILED");
  }
}

export async function getStoredAuthToken() {
  try {
    await ensureSecureStoreAvailable();
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_READ_FAILED");
  }
}

export async function setStoredAuthToken(token: string) {
  try {
    await ensureSecureStoreAvailable();
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_WRITE_FAILED");
  }
}

export async function clearStoredAuthToken() {
  try {
    await ensureSecureStoreAvailable();
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_DELETE_FAILED");
  }
}
