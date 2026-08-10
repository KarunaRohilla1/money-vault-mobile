import { useCallback, useEffect, useState } from "react";

import {
  SECURITY_MESSAGES,
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

export type BiometricEnableResult =
  | { status: "enabled" }
  | { status: "unsupported" }
  | { status: "cancelled" }
  | { status: "failed"; message: string }
  | { status: "error"; message: string };

export type BiometricDisableResult =
  | { status: "disabled" }
  | { status: "error"; message: string };

export type BiometricAuthenticateResult =
  | { status: "success" }
  | { status: "unsupported" }
  | { status: "cancelled" }
  | { status: "failed"; message: string }
  | { status: "error"; message: string };

function storageErrorMessage(error: unknown) {
  if (error instanceof SecureStorageError) {
    return SECURITY_MESSAGES.secureStoreFailure;
  }

  return SECURITY_MESSAGES.unexpectedError;
}

export function useBiometric() {
  const [enabled, setEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsLoading(true);

      try {
        const [supported, stored] = await Promise.all([
          isBiometricSupported(),
          getSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled)
        ]);

        if (cancelled) {
          return;
        }

        setIsSupported(supported);
        setEnabled(stored === "true");
      } catch {
        if (!cancelled) {
          setIsSupported(false);
          setEnabled(false);
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

  const authenticate = useCallback(async (): Promise<BiometricAuthenticateResult> => {
    try {
      const result = await authenticateWithBiometrics();

      if (result.status === "success") {
        return { status: "success" };
      }

      if (result.status === "unavailable") {
        return { status: "unsupported" };
      }

      if (result.status === "cancelled") {
        return { status: "cancelled" };
      }

      return {
        message: result.message ?? SECURITY_MESSAGES.biometricFailed,
        status: "failed"
      };
    } catch (error: unknown) {
      return {
        message: storageErrorMessage(error),
        status: "error"
      };
    }
  }, []);

  const enable = useCallback(async (): Promise<BiometricEnableResult> => {
    if (isUpdating) {
      return { message: SECURITY_MESSAGES.unexpectedError, status: "error" };
    }

    setIsUpdating(true);

    try {
      const supported = await isBiometricSupported();
      setIsSupported(supported);

      if (!supported) {
        return { status: "unsupported" };
      }

      const auth = await authenticateWithBiometrics();

      if (auth.status === "unavailable") {
        setIsSupported(false);
        return { status: "unsupported" };
      }

      if (auth.status === "cancelled") {
        return { status: "cancelled" };
      }

      if (auth.status !== "success") {
        return {
          message: auth.message ?? SECURITY_MESSAGES.biometricFailed,
          status: "failed"
        };
      }

      await setSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled, "true");
      setEnabled(true);
      return { status: "enabled" };
    } catch (error: unknown) {
      return {
        message: storageErrorMessage(error),
        status: "error"
      };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  const disable = useCallback(async (): Promise<BiometricDisableResult> => {
    if (isUpdating) {
      return { message: SECURITY_MESSAGES.unexpectedError, status: "error" };
    }

    setIsUpdating(true);

    try {
      await deleteSecureItem(SECURITY_STORAGE_KEYS.biometricEnabled);
      setEnabled(false);
      return { status: "disabled" };
    } catch (error: unknown) {
      return {
        message: storageErrorMessage(error),
        status: "error"
      };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  return {
    authenticate,
    disable,
    enable,
    enabled,
    isLoading,
    isSupported,
    isUpdating
  };
}
