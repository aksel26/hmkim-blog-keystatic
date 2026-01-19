import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Helper to get supabase URL with fallback
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    // Return a dummy URL during build time
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      return "https://placeholder.supabase.co";
    }
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not set");
    return "https://placeholder.supabase.co";
  }
  return url;
}

// Helper to get anon key with fallback
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      return "placeholder-key";
    }
    console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
    return "placeholder-key";
  }
  return key;
}

// Lazy-initialized client-side Supabase client
let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return _supabaseClient;
}

// Legacy export for compatibility
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};

// Server-side Supabase client (uses service role key for admin operations)
export function createServerClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
