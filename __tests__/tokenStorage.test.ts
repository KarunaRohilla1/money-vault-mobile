import * as SecureStore from "expo-secure-store";

import {
  AUTH_TOKEN_KEY,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
  TokenStorageError,
  verifyTokenStorage
} from "@/services/api/tokenStorage";

describe("token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses an Expo Secure Store compatible token key", () => {
    expect(AUTH_TOKEN_KEY).toMatch(/^[\w.-]+$/);
  });

  it("writes the auth token with the valid storage key", async () => {
    await setStoredAuthToken("jwt-token");

    expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, "jwt-token");
  });

  it("reads the auth token with the valid storage key", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");

    await expect(getStoredAuthToken()).resolves.toBe("jwt-token");

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
  });

  it("deletes the auth token with the valid storage key", async () => {
    await clearStoredAuthToken();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
  });

  it("probes Secure Store set, get, and delete with a temporary value", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("ok");

    await verifyTokenStorage();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_secure_store_probe", "ok");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("money_vault_secure_store_probe");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money_vault_secure_store_probe");
  });

  it("reports unavailable Secure Store distinctly", async () => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(setStoredAuthToken("jwt-token")).rejects.toMatchObject({
      code: "SECURE_STORE_UNAVAILABLE"
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("wraps native write exceptions without exposing the token", async () => {
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error("Invalid key provided to SecureStore."));

    const promise = setStoredAuthToken("sensitive-token");

    await expect(promise).rejects.toBeInstanceOf(TokenStorageError);
    await expect(promise).rejects.toMatchObject({
      code: "SECURE_STORE_WRITE_FAILED"
    });
    await expect(promise).rejects.not.toThrow("sensitive-token");
  });
});
