import {
  isGenericPersonalVaultName,
  personDisplayName,
  vaultCardTitle,
  vaultKindLabel
} from "@/lib/personIdentity";

describe("personIdentity", () => {
  it("treats default Personal vault names as generic type labels", () => {
    expect(isGenericPersonalVaultName("Personal")).toBe(true);
    expect(isGenericPersonalVaultName("Personal Vault")).toBe(true);
    expect(isGenericPersonalVaultName("Karuna")).toBe(false);
  });

  it("prefers the profile display name over vault names", () => {
    expect(personDisplayName("Karuna", "Personal")).toBe("Karuna");
    expect(personDisplayName("  Karuna  ", "Personal")).toBe("Karuna");
  });

  it("does not fall back to Personal vault type/name for greetings", () => {
    expect(personDisplayName(null, "Personal")).toBe("there");
    expect(personDisplayName("", "Personal Vault")).toBe("there");
    expect(personDisplayName(null, "Family")).toBe("Family");
  });

  it("labels personal vault cards with the person name, not Personal", () => {
    expect(vaultCardTitle({ name: "Personal", vaultType: "Individual" }, "Karuna")).toBe("Karuna");
    expect(vaultCardTitle({ name: "Personal", vaultType: "Individual" }, null)).toBe("My Vault");
    expect(vaultKindLabel({ name: "Personal", vaultType: "Individual" })).toBe("Personal Vault");
  });

  it("keeps shared vault names as the card title", () => {
    expect(vaultCardTitle({ name: "Home", vaultType: "Shared" }, "Karuna")).toBe("Home");
    expect(vaultKindLabel({ name: "Home", vaultType: "Shared" })).toBe("Home");
  });
});
