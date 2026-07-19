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
            name: "Vault Under Test",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const response = await apiClient.login({ pin: "1234", vaultName: "Vault Under Test" });

    expect(response.token).toBe("jwt-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/login",
      expect.objectContaining({
        body: JSON.stringify({ pin: "1234", vaultName: "Vault Under Test" }),
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
            name: "Vault Owner",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.login({ pin: "0012", vaultName: "Vault Owner" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/login",
      expect.objectContaining({
        body: JSON.stringify({ pin: "0012", vaultName: "Vault Owner" })
      })
    );
  });

  it("accepts access_token and snake_case vault metadata from login responses", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    globalThis.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "jwt-token",
          expires_at: "2026-07-15T00:00:00Z",
          vault: {
            id: 7,
            is_admin: 1,
            name: "Vault Under Test",
            vault_type: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );

    const { apiClient } = await import("@/services/api/client");
    const response = await apiClient.login({ pin: "1234", vaultName: "Vault Under Test" });

    expect(response).toEqual({
      expiresAt: "2026-07-15T00:00:00Z",
      token: "jwt-token",
      vault: {
        id: "7",
        isAdmin: true,
        name: "Vault Under Test",
        vaultType: "Individual"
      }
    });
  });

  it("rejects incomplete 200 login responses before token storage", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    globalThis.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          vault: {
            id: "1",
            isAdmin: true,
            name: "Vault Under Test",
            vaultType: "Individual"
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );

    const { apiClient } = await import("@/services/api/client");

    await expect(apiClient.login({ pin: "1234", vaultName: "Vault Under Test" })).rejects.toMatchObject({
      code: "LOGIN_RESPONSE_INVALID",
      message: "The login response was incomplete."
    });
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
            name: "Vault Under Test",
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

    await expect(apiClient.login({ pin: "0000", vaultName: "Vault Under Test" })).rejects.toMatchObject({
      code: "INVALID_PIN",
      message: "Incorrect PIN.",
      status: 401
    });
    await expect(apiClient.login({ pin: "0000", vaultName: "Vault Under Test" })).rejects.toBeInstanceOf(ApiClientError);
  });

  it("loads accounts with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getAccounts("jwt-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/accounts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
  });

  it("serializes transaction filters without logging financial payloads", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getTransactions("jwt-token", {
      category: "Food",
      search: "coffee",
      sortBy: "Amount High"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/transactions?category=Food&search=coffee&sortBy=Amount+High",
      expect.objectContaining({
        method: "GET"
      })
    );
  });

  it("loads a transaction detail with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          accountId: 1,
          amount: 250,
          categoryId: 2,
          date: "2026-07-17",
          id: 12,
          notes: "Coffee",
          transactionType: "Expense"
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getTransaction("jwt-token", 12);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/transactions/12",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        }),
        method: "GET"
      })
    );
  });

  it("loads planning with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          commitments: [],
          cycle: {
            endDate: "2026-07-31",
            id: 1,
            startDate: "2026-07-01",
            startMonth: 7,
            startYear: 2026,
            status: "CURRENT",
            vaultId: 1
          },
          incomeTemplates: [],
          totals: {
            commitmentsCompleted: 0,
            commitmentsPlanned: 0,
            expenses: 0,
            income: 0,
            incomePlanned: 0,
            incomeReceived: 0,
            plannedCommitments: 0,
            projectedSavings: 0,
            remainingCommitments: 0,
            savingsGoal: 0
          }
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getPlanning("jwt-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/planning",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
  });

  it("writes planning status through the backend API", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.setCommitmentStatus("jwt-token", 12, {
      actualAmount: 500,
      month: 7,
      status: "PAID",
      year: 2026
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/planning/commitments/12/status",
      expect.objectContaining({
        body: JSON.stringify({
          actualAmount: 500,
          month: 7,
          status: "PAID",
          year: 2026
        }),
        method: "POST"
      })
    );
  });

  it("loads wishlist with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          categories: [],
          items: [],
          summary: {
            progress: 0,
            totalCost: 0,
            totalItems: 0,
            totalSaved: 0
          }
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getWishlist("jwt-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/wishlist",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
  });

  it("loads reports with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          categoryBreakdown: [],
          generatedAt: "2026-07-15T00:00:00Z",
          monthlyTrend: [],
          period: {},
          summary: {}
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getReports("jwt-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/reports",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
  });

  it("loads shared expenses and bills with bearer authorization", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            completed_bills: [],
            expenses: [],
            pending_bills: [],
            summary: {}
          }
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getSharedExpenses("jwt-token", 40);
    await apiClient.getSharedBills("jwt-token", 40);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.money-vault.test/api/shared/expenses?sharedVaultId=40",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.money-vault.test/api/shared/bills?sharedVaultId=40",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token"
        })
      })
    );
  });

  it("serializes independent transfer history filters", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.getTransfers("jwt-token", {
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      destinationAccountId: 2,
      sourceAccountId: 1
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/transfers?sourceAccountId=1&destinationAccountId=2&dateFrom=2026-07-01&dateTo=2026-07-31",
      expect.objectContaining({
        method: "GET"
      })
    );
  });

  it("posts shared bill actions through the backend API", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    await apiClient.markSharedBillPaid("jwt-token", 12, 4, "2026-07-17");
    await apiClient.skipSharedBill("jwt-token", 13);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.money-vault.test/api/shared/bills/instances/12/paid",
      expect.objectContaining({
        body: JSON.stringify({
          payerVaultId: 4,
          paymentDate: "2026-07-17"
        }),
        method: "POST"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.money-vault.test/api/shared/bills/instances/13/skip",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
