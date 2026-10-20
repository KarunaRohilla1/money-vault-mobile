import {
  DEFAULT_DEV_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  isLocalApiBaseUrl,
  readApiBaseUrl,
  readAppEnvironment
} from "@/lib/env";

describe("Mobile Environment Resolution", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_APP_ENV;
    delete process.env.APP_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isLocalApiBaseUrl", () => {
    it("identifies localhost and loopback addresses as local", () => {
      expect(isLocalApiBaseUrl("http://localhost:8001")).toBe(true);
      expect(isLocalApiBaseUrl("http://127.0.0.1:8001")).toBe(true);
    });

    it("identifies Android emulator host (10.0.2.2) as local", () => {
      expect(isLocalApiBaseUrl("http://10.0.2.2:8001")).toBe(true);
    });

    it("identifies LAN IP addresses (192.168.x.x, 10.x.x.x) as local", () => {
      expect(isLocalApiBaseUrl("http://192.168.1.16:8001")).toBe(true);
      expect(isLocalApiBaseUrl("http://10.0.0.5:8000")).toBe(true);
    });

    it("identifies remote Cloud Run / production domains as non-local", () => {
      expect(isLocalApiBaseUrl("https://money-vault-api-316223429546.asia-south1.run.app")).toBe(false);
      expect(isLocalApiBaseUrl("https://api.moneyvault.app")).toBe(false);
    });
  });

  describe("readAppEnvironment", () => {
    it("defaults to development if no env var is set", () => {
      expect(readAppEnvironment()).toBe("development");
    });

    it("reads EXPO_PUBLIC_APP_ENV if provided", () => {
      process.env.EXPO_PUBLIC_APP_ENV = "production";
      expect(readAppEnvironment()).toBe("production");
    });
  });

  describe("readApiBaseUrl", () => {
    it("defaults development to local LAN server (DEFAULT_DEV_API_BASE_URL)", () => {
      process.env.EXPO_PUBLIC_APP_ENV = "development";
      expect(readApiBaseUrl()).toBe(DEFAULT_DEV_API_BASE_URL);
      expect(readApiBaseUrl()).toBe("http://192.168.1.16:8001");
    });

    it("defaults production to Cloud Run (PRODUCTION_API_BASE_URL)", () => {
      process.env.EXPO_PUBLIC_APP_ENV = "production";
      expect(readApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
    });

    it("respects explicit EXPO_PUBLIC_API_BASE_URL in development", () => {
      process.env.EXPO_PUBLIC_APP_ENV = "development";
      process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.50:8001";
      expect(readApiBaseUrl()).toBe("http://192.168.1.50:8001");
    });

    it("throws an error if production is configured with a local API URL", () => {
      process.env.EXPO_PUBLIC_APP_ENV = "production";
      process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.16:8001";
      expect(() => readApiBaseUrl()).toThrow("Production builds cannot use a local API base URL.");
    });
  });
});
