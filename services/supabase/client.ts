import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { secureStorage } from "@/services/supabase/secureStorage";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
