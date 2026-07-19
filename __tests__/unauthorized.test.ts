import { apiClient } from "@/services/api/client";
import { registerUnauthorizedHandler } from "@/services/api/unauthorized";

describe("centralized confirmed 401 handling", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  let unregister: (() => void) | null = null;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
  });

  afterEach(() => {
    if (unregister) {
      unregister();
      unregister = null;
    }
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  });

  function installHandler(handler: () => Promise<void> | void) {
    unregister = registerUnauthorizedHandler(handler);
  }

  it.each([
    ["Dashboard", () => apiClient.getDashboard("jwt-token")],
    ["Accounts", () => apiClient.getAccounts("jwt-token")],
    ["Transfers", () => apiClient.getTransfers("jwt-token")]
  ])("%s 401 clears through the central handler", async (_label, callApi) => {
    const handler = jest.fn();
    installHandler(handler);
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ code: "INVALID_SESSION", message: "Invalid session." }), { status: 401 }));

    await expect(callApi()).rejects.toMatchObject({ status: 401 });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("simultaneous 401 responses share one central clear", async () => {
    let resolveClear: (() => void) | undefined;
    const handler = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveClear = resolve;
        })
    );
    installHandler(handler);
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ code: "INVALID_SESSION", message: "Invalid session." }), { status: 401 }));

    const requests = Promise.allSettled([
      apiClient.getDashboard("jwt-token"),
      apiClient.getAccounts("jwt-token"),
      apiClient.getTransfers("jwt-token")
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      const finishClear = resolveClear;
      if (finishClear) {
        finishClear();
      }
    }
    await requests;
  });

  it.each([
    ["network error", async () => {
      throw new TypeError("Network request failed");
    }],
    ["server error", async () => new Response(JSON.stringify({ code: "SERVER_ERROR", message: "Server error." }), { status: 500 })]
  ])("%s preserves the session", async (_label, fetchImpl) => {
    const handler = jest.fn();
    installHandler(handler);
    globalThis.fetch = jest.fn(fetchImpl);

    await expect(apiClient.getDashboard("jwt-token")).rejects.toBeTruthy();

    expect(handler).not.toHaveBeenCalled();
  });

  it("shared vault PIN 401 remains a credential error and does not clear the session", async () => {
    const handler = jest.fn();
    installHandler(handler);
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ code: "INVALID_PIN", message: "Incorrect PIN." }), { status: 401 }));

    await expect(apiClient.activateSharedVault("jwt-token", { pin: "0123", sharedVaultId: 2 })).rejects.toMatchObject({ status: 401 });

    expect(handler).not.toHaveBeenCalled();
  });
});
