export interface ChangePinFormValues {
  confirmPin: string;
  currentPin: string;
  newPin: string;
}

export interface ChangePinFormErrors {
  confirmPin?: string;
  currentPin?: string;
  newPin?: string;
}

export const PIN_REQUIREMENT_MESSAGE = "PIN must be between 4 and 6 characters.";

function pinRequirementError(pin: string, requiredMessage: string): string | undefined {
  if (!pin) {
    return requiredMessage;
  }

  if (pin.length < 4 || pin.length > 6) {
    return PIN_REQUIREMENT_MESSAGE;
  }

  return undefined;
}

export function changePinFormErrors(values: ChangePinFormValues): ChangePinFormErrors {
  const errors: ChangePinFormErrors = {};
  const currentPinError = pinRequirementError(values.currentPin, "Current PIN is required.");
  const newPinError = pinRequirementError(values.newPin, "New PIN is required.");

  if (currentPinError) {
    errors.currentPin = currentPinError;
  }

  if (newPinError) {
    errors.newPin = newPinError;
  } else if (values.currentPin && values.newPin === values.currentPin) {
    errors.newPin = "New PIN must differ from current PIN.";
  }

  if (!values.confirmPin) {
    errors.confirmPin = "Confirm the new PIN.";
  } else if (values.newPin && values.confirmPin !== values.newPin) {
    errors.confirmPin = "New PIN and confirmation do not match.";
  }

  return errors;
}

export function changePinFormError(values: ChangePinFormValues): string | null {
  const errors = changePinFormErrors(values);
  return errors.currentPin ?? errors.newPin ?? errors.confirmPin ?? null;
}
