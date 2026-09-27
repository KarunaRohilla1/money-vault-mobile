export const SECURITY_STORAGE_KEYS = {
  autoLockTimeout: "security.autoLockTimeout",
  biometricEnabled: "security.biometricEnabled",
  biometricUserId: "security.biometricUserId",
  pinSalt: "security.pinSalt",
  pinUserId: "security.pinUserId",
  pinVerifier: "security.pinVerifier"
} as const;

export type AutoLockTimeout = "immediately" | "1m" | "5m" | "15m" | "never";

export interface AutoLockOption {
  label: string;
  value: AutoLockTimeout;
}

export const AUTO_LOCK_OPTIONS: readonly AutoLockOption[] = [
  { label: "Immediately", value: "immediately" },
  { label: "1 minute", value: "1m" },
  { label: "5 minutes", value: "5m" },
  { label: "15 minutes", value: "15m" },
  { label: "Never", value: "never" }
] as const;

export const DEFAULT_AUTO_LOCK_TIMEOUT: AutoLockTimeout = "5m";

export const SECURITY_MESSAGES = {
  biometricAuthPrompt: "Confirm biometrics to unlock Money Vault",
  biometricUnsupported: "Biometric authentication isn't available on this device.",
  biometricFailed: "Biometric authentication failed. Try again.",
  biometricCancelled: "Biometric authentication was cancelled.",
  secureStoreFailure: "Could not save your security preference. Try again.",
  unexpectedError: "Something went wrong. Try again.",
  pinUpdated: "Your PIN has been updated.",
  currentPinIncorrect: "Current PIN is incorrect.",
  pinUpdateUnavailable: "Money Vault API is unavailable. Try again.",
  pinUpdateMissingSession: "Sign in again to change your PIN."
} as const;

export const SECURITY_COPY = {
  authenticationDescription: "Use your fingerprint or Face ID to unlock Money Vault.",
  authenticationTitle: "Unlock with Fingerprint",
  autoLockDescription: "Automatically lock the app after a period of inactivity.",
  autoLockTitle: "Auto Lock",
  changePinDescription: "Update your 4 to 6 character PIN.",
  changePinTitle: "Change PIN",
  forgotPin: "Forgot PIN?",
  infoBody: "Your PIN and biometric authentication are stored securely on your device.\nBiometric information never leaves your device.",
  infoTitle: "Your data is always secure",
  recoveryCodeDescription: "Create a new recovery code. Your previous code will stop working.",
  recoveryCodeTitle: "Generate recovery code",
  screenDescription: "Manage how you sign in and keep your money safe",
  screenTitle: "Security",
  unlockTitle: "Unlock",
  useAnotherAccount: "Use another account"
} as const;

export function autoLockLabel(timeout: AutoLockTimeout) {
  return AUTO_LOCK_OPTIONS.find((option) => option.value === timeout)?.label ?? AUTO_LOCK_OPTIONS[2]!.label;
}

export function parseAutoLockTimeout(value: string | null): AutoLockTimeout {
  if (value && AUTO_LOCK_OPTIONS.some((option) => option.value === value)) {
    return value as AutoLockTimeout;
  }

  return DEFAULT_AUTO_LOCK_TIMEOUT;
}
