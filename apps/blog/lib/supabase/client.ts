import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./schema";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      return "https://placeholder.supabase.co";
    }
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not set");
    return "https://placeholder.supabase.co";
  }
  return url;
}

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

let _supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!_supabaseClient) {
    _supabaseClient = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return _supabaseClient;
}

export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};
