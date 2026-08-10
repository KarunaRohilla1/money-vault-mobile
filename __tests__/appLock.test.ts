import {
  autoLockTimeoutMs,
  shouldLockAfterBackground
} from "@/features/settings/security/services/appLock.service";

describe("app lock policy", () => {
  it("maps auto-lock timeouts to milliseconds", () => {
    expect(autoLockTimeoutMs("immediately")).toBe(0);
    expect(autoLockTimeoutMs("1m")).toBe(60_000);
    expect(autoLockTimeoutMs("5m")).toBe(5 * 60_000);
    expect(autoLockTimeoutMs("15m")).toBe(15 * 60_000);
    expect(autoLockTimeoutMs("never")).toBeNull();
  });

  it("does not lock when biometrics are disabled", () => {
    expect(
      shouldLockAfterBackground({
        backgroundedAt: Date.now() - 10_000,
        biometricEnabled: false,
        timeout: "immediately"
      })
    ).toBe(false);
  });

  it("locks immediately when configured", () => {
    expect(
      shouldLockAfterBackground({
        backgroundedAt: Date.now(),
        biometricEnabled: true,
        timeout: "immediately"
      })
    ).toBe(true);
  });

  it("locks only after the idle window elapses", () => {
    const now = 1_000_000;
    expect(
      shouldLockAfterBackground({
        backgroundedAt: now - 59_000,
        biometricEnabled: true,
        now,
        timeout: "1m"
      })
    ).toBe(false);
    expect(
      shouldLockAfterBackground({
        backgroundedAt: now - 61_000,
        biometricEnabled: true,
        now,
        timeout: "1m"
      })
    ).toBe(true);
  });

  it("never auto-locks on resume when timeout is never", () => {
    expect(
      shouldLockAfterBackground({
        backgroundedAt: Date.now() - 60 * 60_000,
        biometricEnabled: true,
        timeout: "never"
      })
    ).toBe(false);
  });
});
