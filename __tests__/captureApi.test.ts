describe("capture api client", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
  });

  it("calls capture inbox, parse, create, approve, and delete endpoints", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.endsWith("/api/capture/inbox") && method === "GET") {
        return new Response(
          JSON.stringify({
            failed: [],
            needsReview: [],
            ready: []
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (url.endsWith("/api/capture/parse") && method === "POST") {
        return new Response(
          JSON.stringify({
            draftTransaction: {
              amount: 450,
              confidence: { overall: 88 },
              merchant: "Swiggy",
              rawText: "paid swiggy",
              status: "NEEDS_REVIEW",
              vaultId: 4
            }
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (url.endsWith("/api/capture/drafts") && method === "POST") {
        return new Response(
          JSON.stringify({
            draftTransaction: {
              amount: 450,
              confidence: { overall: 88 },
              id: 11,
              merchant: "Swiggy",
              rawText: "paid swiggy",
              status: "READY_TO_APPROVE",
              vaultId: 4
            }
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (url.endsWith("/api/capture/drafts/11/approve") && method === "POST") {
        return new Response(
          JSON.stringify({
            draftTransaction: {
              amount: 450,
              confidence: { overall: 88 },
              id: 11,
              merchant: "Swiggy",
              rawText: "paid swiggy",
              status: "APPROVED",
              vaultId: 4
            },
            transactionId: 99
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (url.endsWith("/api/capture/drafts/11") && method === "DELETE") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
          status: 200
        });
      }

      return new Response("not found", { status: 404 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { apiClient } = await import("@/services/api/client");

    await expect(apiClient.getCaptureInbox("token")).resolves.toEqual({
      failed: [],
      needsReview: [],
      ready: []
    });

    await expect(apiClient.parseCapture("token", { rawText: "paid swiggy" })).resolves.toMatchObject({
      draftTransaction: { merchant: "Swiggy" }
    });

    await expect(apiClient.createCaptureDraft("token", { rawText: "paid swiggy" })).resolves.toMatchObject({
      draftTransaction: { id: 11 }
    });

    await expect(apiClient.approveCaptureDraft("token", 11, { accountId: 1 })).resolves.toMatchObject({
      transactionId: 99
    });

    await expect(apiClient.deleteCaptureDraft("token", 11)).resolves.toEqual({ status: "ok" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/capture/parse",
      expect.objectContaining({
        body: JSON.stringify({ rawText: "paid swiggy" }),
        method: "POST"
      })
    );
  });
});
