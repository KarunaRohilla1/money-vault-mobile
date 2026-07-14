import { useAuthStore } from "@/stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
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
      vault: null
    });
  });
});
