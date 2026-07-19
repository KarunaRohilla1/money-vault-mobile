describe("dashboard API", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
  });

  it("throws for network failures instead of returning empty dashboard data", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError("Network request failed");
    });

    const { ApiClientError, apiClient } = await import("@/services/api/client");

    await expect(apiClient.getDashboard("jwt-token")).rejects.toMatchObject({
      isNetworkError: true,
      status: null
    });
    await expect(apiClient.getDashboard("jwt-token")).rejects.toBeInstanceOf(ApiClientError);
  });

  it("throws for HTTP 500 instead of returning empty dashboard data", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ code: "SERVER_ERROR", message: "Server error." }), { status: 500 }));

    const { ApiClientError, apiClient } = await import("@/services/api/client");

    await expect(apiClient.getDashboard("jwt-token")).rejects.toMatchObject({
      code: "SERVER_ERROR",
      message: "Server error.",
      status: 500
    });
    await expect(apiClient.getDashboard("jwt-token")).rejects.toBeInstanceOf(ApiClientError);
  });
});
