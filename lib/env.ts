import Constants from "expo-constants";
import { z } from "zod";

const PRODUCTION_API_BASE_URL = "https://money-vault-api-316223429546.asia-south1.run.app";
const localApiHostPattern = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/u;

const envSchema = z.object({
  apiBaseUrl: z.string().url()
});

function readAppEnvironment() {
  const appEnvironment = Constants.expoConfig?.extra?.appEnvironment;

  return typeof appEnvironment === "string" ? appEnvironment : process.env.EXPO_PUBLIC_APP_ENV ?? "development";
}

function isLocalApiBaseUrl(value: string) {
  try {
    return localApiHostPattern.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

function readApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? Constants.expoConfig?.extra?.apiBaseUrl;
  const appEnvironment = readAppEnvironment();

  if (typeof configuredUrl === "string" && configuredUrl.length > 0) {
    if (appEnvironment === "production" && isLocalApiBaseUrl(configuredUrl)) {
      throw new Error("Production builds cannot use a local API base URL.");
    }

    return configuredUrl;
  }

  if (appEnvironment === "production") {
    return PRODUCTION_API_BASE_URL;
  }

  return configuredUrl;
}

const rawEnv = {
  apiBaseUrl: readApiBaseUrl()
};

export const env = envSchema.parse(rawEnv);
