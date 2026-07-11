import Constants from "expo-constants";
import { z } from "zod";

const envSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1)
});

const rawEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? Constants.expoConfig?.extra?.supabaseUrl,
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? Constants.expoConfig?.extra?.supabaseAnonKey
};

export const env = envSchema.parse(rawEnv);
