import { registrationError } from "@/services/auth/credentials";

describe("username registration validation", () => {
  it("rejects a display name that matches the username", () => {
    expect(
      registrationError({
        confirmPin: "1234",
        displayName: "Karuna",
        pin: "1234",
        username: "karuna"
      })
    ).toBe("Display name must be different from your username.");
  });

  it("accepts a valid username, display name, and PIN", () => {
    expect(
      registrationError({
        confirmPin: "1234",
        displayName: "Karuna",
        pin: "1234",
        username: "karuna_1"
      })
    ).toBeNull();
  });
});
