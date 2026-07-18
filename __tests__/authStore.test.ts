import { useAuthStore } from "@/stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authenticatedVault: null,
      errorMessage: null,
      status: "booting",
      token: null,
      vault: null
    });
  });

  it("keeps restore errors visible when moving to signed-out state", () => {
    useAuthStore.getState().setSignedOut("Unable to restore backend session. Check your connection and try again.");

    expect(useAuthStore.getState()).toMatchObject({
      errorMessage: "Unable to restore backend session. Check your connection and try again.",
      status: "signed-out",
      token: null,
      authenticatedVault: null,
      vault: null
    });
  });

  it("stores active and authenticated vault contexts separately", () => {
    const personalVault = {
      id: "1",
      isAdmin: true,
      name: "Personal",
      vaultType: "Individual"
    };
    const sharedVault = {
      id: "2",
      isAdmin: false,
      name: "Shared",
      vaultType: "Shared"
    };

    useAuthStore.getState().setAuthenticated("jwt-token", sharedVault, personalVault);

    expect(useAuthStore.getState()).toMatchObject({
      authenticatedVault: personalVault,
      status: "authenticated",
      token: "jwt-token",
      vault: sharedVault
    });
  });
});
