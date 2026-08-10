import * as SecureStore from "expo-secure-store";

export type SecureStorageErrorCode =
  | "SECURE_STORE_DELETE_FAILED"
  | "SECURE_STORE_READ_FAILED"
  | "SECURE_STORE_UNAVAILABLE"
  | "SECURE_STORE_WRITE_FAILED";

export class SecureStorageError extends Error {
  public readonly cause: unknown;
  public readonly code: SecureStorageErrorCode;

  public constructor(message: string, code: SecureStorageErrorCode, cause?: unknown) {
    super(message);
    this.name = "SecureStorageError";
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

  console.warn("[SecureStorage]", {
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
    throw new SecureStorageError(
      "Secure Store is unavailable in this runtime.",
      "SECURE_STORE_UNAVAILABLE"
    );
  }
}

function normalizeStorageError(error: unknown, code: SecureStorageErrorCode) {
  logSecureStoreException(error);

  if (error instanceof SecureStorageError) {
    return error;
  }

  return new SecureStorageError("Secure Store could not complete the operation.", code, error);
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    await ensureSecureStoreAvailable();
    return await SecureStore.getItemAsync(key);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_READ_FAILED");
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await ensureSecureStoreAvailable();
    await SecureStore.setItemAsync(key, value);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_WRITE_FAILED");
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await ensureSecureStoreAvailable();
    await SecureStore.deleteItemAsync(key);
  } catch (error: unknown) {
    throw normalizeStorageError(error, "SECURE_STORE_DELETE_FAILED");
  }
}
