import { SECURITY_MESSAGES } from "@/features/settings/security/constants/security";
import { storeLocalPin } from "@/features/settings/security/services/pinLock.service";
import { changePinFormErrors, type ChangePinFormErrors, type ChangePinFormValues } from "@/features/settings/security/changePinModel";
import { ApiClientError, apiClient } from "@/services/api/client";
import { useAuthStore } from "@/stores/authStore";

export class ChangePinValidationError extends Error {
  public readonly fieldErrors: ChangePinFormErrors;

  public constructor(fieldErrors: ChangePinFormErrors) {
    super(fieldErrors.currentPin ?? fieldErrors.newPin ?? fieldErrors.confirmPin ?? "Check your PIN details.");
    this.name = "ChangePinValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export interface ChangeVaultPinInput extends ChangePinFormValues {
  token: string;
}

export async function changeVaultPin(input: ChangeVaultPinInput): Promise<void> {
  const fieldErrors = changePinFormErrors(input);

  if (fieldErrors.currentPin || fieldErrors.newPin || fieldErrors.confirmPin) {
    throw new ChangePinValidationError(fieldErrors);
  }

  try {
    await apiClient.changePin(input.token, {
      confirmPin: input.confirmPin,
      currentPin: input.currentPin,
      newPin: input.newPin
    });
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.code === "INVALID_PIN")) {
      throw new ChangePinValidationError({ currentPin: SECURITY_MESSAGES.currentPinIncorrect });
    }

    throw error;
  }

  const userId = useAuthStore.getState().userId;
  await storeLocalPin(input.newPin, userId);
}

export function changePinSubmitError(error: unknown): { fieldErrors?: ChangePinFormErrors; message: string } {
  if (error instanceof ChangePinValidationError) {
    return {
      fieldErrors: error.fieldErrors,
      message: error.message
    };
  }

  if (error instanceof ApiClientError && error.status === 401) {
    return { message: SECURITY_MESSAGES.currentPinIncorrect };
  }

  if (error instanceof ApiClientError) {
    return { message: SECURITY_MESSAGES.pinUpdateUnavailable };
  }

  return { message: SECURITY_MESSAGES.unexpectedError };
}
