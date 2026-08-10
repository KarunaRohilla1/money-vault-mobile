import * as LocalAuthentication from "expo-local-authentication";

import { SECURITY_MESSAGES } from "@/features/settings/security/constants/security";

export type BiometricAuthStatus = "success" | "cancelled" | "failed" | "unavailable";

export interface BiometricAuthResult {
  message?: string;
  status: BiometricAuthStatus;
}

export async function isBiometricSupported(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync()
    ]);

    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(promptMessage: string = SECURITY_MESSAGES.biometricAuthPrompt): Promise<BiometricAuthResult> {
  const supported = await isBiometricSupported();

  if (!supported) {
    return {
      message: SECURITY_MESSAGES.biometricUnsupported,
      status: "unavailable"
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: "Cancel",
      disableDeviceFallback: true,
      promptMessage
    });

    if (result.success) {
      return { status: "success" };
    }

    const cancelled =
      result.error === "user_cancel" ||
      result.error === "system_cancel" ||
      result.error === "app_cancel";

    if (cancelled) {
      return {
        message: SECURITY_MESSAGES.biometricCancelled,
        status: "cancelled"
      };
    }

    return {
      message: SECURITY_MESSAGES.biometricFailed,
      status: "failed"
    };
  } catch (error: unknown) {
    return {
      message: error instanceof Error ? error.message : SECURITY_MESSAGES.unexpectedError,
      status: "failed"
    };
  }
}
