import { invalidateTransferDependents } from "@/features/transfers/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

describe("transfer invalidation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  it("invalidates the active vault transfer prefix and dependents once", async () => {
    const invalidate = jest.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

    await invalidateTransferDependents("vault-a");

    expect(invalidate).toHaveBeenCalledTimes(4);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.transfers.byVault("vault-a") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.accounts.byVault("vault-a") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("vault-a") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.list("vault-a") });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: queryKeys.transfers.byVault("vault-b") });
  });
});
