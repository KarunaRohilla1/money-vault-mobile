import { useCallback, useEffect, useMemo, useState } from "react";

import {
  autoLockLabel,
  DEFAULT_AUTO_LOCK_TIMEOUT,
  parseAutoLockTimeout,
  SECURITY_MESSAGES,
  SECURITY_STORAGE_KEYS,
  type AutoLockTimeout
} from "@/features/settings/security/constants/security";
import {
  getSecureItem,
  SecureStorageError,
  setSecureItem
} from "@/features/settings/security/services/secureStorage.service";

export type AutoLockSetResult =
  | { status: "saved"; timeout: AutoLockTimeout }
  | { status: "error"; message: string };

function storageErrorMessage(error: unknown) {
  if (error instanceof SecureStorageError) {
    return SECURITY_MESSAGES.secureStoreFailure;
  }

  return SECURITY_MESSAGES.unexpectedError;
}

export function useAutoLock() {
  const [currentTimeout, setCurrentTimeout] = useState<AutoLockTimeout>(DEFAULT_AUTO_LOCK_TIMEOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsLoading(true);

      try {
        const stored = await getSecureItem(SECURITY_STORAGE_KEYS.autoLockTimeout);

        if (!cancelled) {
          setCurrentTimeout(parseAutoLockTimeout(stored));
        }
      } catch {
        if (!cancelled) {
          setCurrentTimeout(DEFAULT_AUTO_LOCK_TIMEOUT);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const setTimeout = useCallback(async (timeout: AutoLockTimeout): Promise<AutoLockSetResult> => {
    if (isUpdating) {
      return { message: SECURITY_MESSAGES.unexpectedError, status: "error" };
    }

    setIsUpdating(true);

    try {
      await setSecureItem(SECURITY_STORAGE_KEYS.autoLockTimeout, timeout);
      setCurrentTimeout(timeout);
      return { status: "saved", timeout };
    } catch (error: unknown) {
      return {
        message: storageErrorMessage(error),
        status: "error"
      };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  const currentLabel = useMemo(() => autoLockLabel(currentTimeout), [currentTimeout]);

  return {
    currentLabel,
    currentTimeout,
    isLoading,
    isUpdating,
    setTimeout
  };
}
