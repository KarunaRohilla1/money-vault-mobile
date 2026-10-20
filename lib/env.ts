import Constants from "expo-constants";
import { z } from "zod";

export const PRODUCTION_API_BASE_URL = "https://money-vault-api-316223429546.asia-south1.run.app";
export const DEFAULT_DEV_API_BASE_URL = "http://192.168.1.16:8001";
const localApiHostPattern = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/u;

const envSchema = z.object({
  apiBaseUrl: z.string().url()
});

export function readAppEnvironment(): string {
  const appEnvironment = Constants.expoConfig?.extra?.appEnvironment ?? process.env.EXPO_PUBLIC_APP_ENV ?? process.env.APP_ENV;

  return typeof appEnvironment === "string" ? appEnvironment.trim().toLowerCase() : "development";
}

export function isLocalApiBaseUrl(value: string): boolean {
  try {
    return localApiHostPattern.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function readApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? Constants.expoConfig?.extra?.apiBaseUrl;
  const appEnvironment = readAppEnvironment();
  const isProduction = appEnvironment === "production";

  if (typeof configuredUrl === "string" && configuredUrl.trim().length > 0) {
    const trimmed = configuredUrl.trim();
    if (isProduction && isLocalApiBaseUrl(trimmed)) {
      throw new Error("Production builds cannot use a local API base URL.");
    }

    return trimmed;
  }

  if (isProduction) {
    return PRODUCTION_API_BASE_URL;
  }

  // Development & preview defaults to local development server, NEVER to Cloud Run production
  return DEFAULT_DEV_API_BASE_URL;
}

const resolvedAppEnv = readAppEnvironment();
const resolvedApiBaseUrl = readApiBaseUrl();

console.log(`[Money Vault Config] Environment: ${resolvedAppEnv} | API Base URL: ${resolvedApiBaseUrl}`);

const rawEnv = {
  apiBaseUrl: resolvedApiBaseUrl
};

export const env = envSchema.parse(rawEnv);

