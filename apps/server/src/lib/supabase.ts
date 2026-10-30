import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let supabaseClient: SupabaseClient | null = null;

if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY!;
  supabaseClient = createClient(env.SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = supabaseClient;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment variables."
    );
  }
  return supabaseClient;
}
