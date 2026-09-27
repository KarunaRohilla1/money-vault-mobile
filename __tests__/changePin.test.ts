import { changePinSubmitError, changeVaultPin, ChangePinValidationError } from "@/features/settings/security/changePin";
import { changePinFormError, changePinFormErrors } from "@/features/settings/security/changePinModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient, ApiClientError } from "@/services/api/client";
import { useAuthStore } from "@/stores/authStore";

const vault = {
  id: "1",
  isAdmin: true,
  name: "Vault Under Test",
  vaultType: "Individual" as const
};

const validInput = {
  confirmPin: "5678",
  currentPin: "1234",
  newPin: "5678",
  token: "jwt-token",
  vaultName: vault.name
};

describe("change PIN validation", () => {
  it("requires current, new, and confirmation PINs", () => {
    expect(changePinFormError({ confirmPin: "", currentPin: "", newPin: "" })).toBe("Current PIN is required.");
    expect(changePinFormErrors({ confirmPin: "", currentPin: "1234", newPin: "" }).newPin).toBe("New PIN is required.");
    expect(changePinFormErrors({ confirmPin: "", currentPin: "1234", newPin: "5678" }).confirmPin).toBe("Confirm the new PIN.");
  });

  it("enforces the existing 4 to 6 character PIN requirement", () => {
    expect(changePinFormErrors({ confirmPin: "12", currentPin: "12", newPin: "12" }).currentPin).toBe(
      "PIN must be between 4 and 6 characters."
    );
    expect(changePinFormErrors({ confirmPin: "1234567", currentPin: "1234", newPin: "1234567" }).newPin).toBe(
      "PIN must be between 4 and 6 characters."
    );
    expect(changePinFormError({ confirmPin: "12345", currentPin: "1234", newPin: "12345" })).toBeNull();
  });

  it("requires the new PIN to match confirmation and differ from the current PIN", () => {
    expect(changePinFormErrors({ confirmPin: "5678", currentPin: "1234", newPin: "1234" }).newPin).toBe(
      "New PIN must differ from current PIN."
    );
    expect(changePinFormErrors({ confirmPin: "9999", currentPin: "1234", newPin: "5678" }).confirmPin).toBe(
      "New PIN and confirmation do not match."
    );
  });
});

describe("changeVaultPin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuthenticated("jwt-token", vault, vault);
    queryClient.setQueryData(queryKeys.dashboard.current(vault.id), { stale: true });
  });

  it("persists the new PIN through the authenticated user endpoint without replacing the session", async () => {
    const changePin = jest.spyOn(apiClient, "changePin").mockResolvedValueOnce({
      accessibleVaults: [],
      authenticatedVault: vault,
      pinSet: true,
      vault
    });

    await changeVaultPin(validInput);

    expect(changePin).toHaveBeenCalledWith("jwt-token", {
      confirmPin: "5678",
      currentPin: "1234",
      newPin: "5678"
    });
    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      token: "jwt-token",
      vault
    });
    expect(queryClient.getQueryData(queryKeys.dashboard.current(vault.id))).toEqual({ stale: true });
  });

  it("rejects an incorrect current PIN without updating settings", async () => {
    jest.spyOn(apiClient, "changePin").mockRejectedValueOnce(
      new ApiClientError("Current PIN is incorrect.", {
        code: "INVALID_PIN",
        isNetworkError: false,
        status: 401
      })
    );

    await expect(changeVaultPin(validInput)).rejects.toMatchObject({
      fieldErrors: { currentPin: "Current PIN is incorrect." },
      name: "ChangePinValidationError"
    });
    expect(useAuthStore.getState().token).toBe("jwt-token");
  });

  it("does not call the API when local validation fails", async () => {
    const changePin = jest.spyOn(apiClient, "changePin");

    await expect(
      changeVaultPin({
        ...validInput,
        confirmPin: "9999"
      })
    ).rejects.toBeInstanceOf(ChangePinValidationError);

    expect(changePin).not.toHaveBeenCalled();
  });

  it("maps API failures to a safe submit error", () => {
    expect(
      changePinSubmitError(
        new ApiClientError("The settings response was incomplete.", {
          code: "HTTP_503",
          isNetworkError: false,
          status: 503
        })
      ).message
    ).toBe("Money Vault API is unavailable. Try again.");
  });
});
