describe("apiClient", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
  });

  it("sends login requests to the backend API", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          token: "jwt-token",
          vault: {
            id: "1",
            isAdmin: true,
            name: "Karuna",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const response = await apiClient.login({ pin: "1234", vaultName: "Karuna" });

    expect(response.token).toBe("jwt-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/login",
      expect.objectContaining({
        body: JSON.stringify({ pin: "1234", vaultName: "Karuna" }),
        method: "POST"
      })
    );
  });

  it("preserves exact vault name and leading-zero PIN strings", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          token: "jwt-token",
          vault: {
            id: "1",
            isAdmin: true,
            name: "Karuna Rohilla",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.login({ pin: "0012", vaultName: "Karuna Rohilla" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/login",
      expect.objectContaining({
        body: JSON.stringify({ pin: "0012", vaultName: "Karuna Rohilla" })
      })
    );
  });

  it("adds bearer authorization for dashboard requests", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test/";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          data: {},
          generatedAt: "2026-07-12T00:00:00.000Z",
          vault: {
            id: "1",
            isAdmin: false,
            name: "Karuna",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getDashboard("jwt-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        }),
        method: "GET"
      })
    );
  });

  it("normalizes API error responses", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    globalThis.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ code: "INVALID_PIN", message: "Incorrect PIN." }), { status: 401 })
    );

    const { ApiClientError, apiClient } = await import("@/services/api/client");

    await expect(apiClient.login({ pin: "0000", vaultName: "Karuna" })).rejects.toMatchObject({
      code: "INVALID_PIN",
      message: "Incorrect PIN.",
      status: 401
    });
    await expect(apiClient.login({ pin: "0000", vaultName: "Karuna" })).rejects.toBeInstanceOf(ApiClientError);
  });
});
