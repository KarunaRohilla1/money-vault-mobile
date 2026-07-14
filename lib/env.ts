import Constants from "expo-constants";
import { z } from "zod";

const envSchema = z.object({
  apiBaseUrl: z.string().url()
});

const rawEnv = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? Constants.expoConfig?.extra?.apiBaseUrl
};

export const env = envSchema.parse(rawEnv);
