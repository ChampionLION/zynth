import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function publicSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}
export function isSupabaseConfigured(): boolean {
  const { url, key } = publicSupabaseConfig();
  return Boolean(url && key);
}
let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  const { url, key } = publicSupabaseConfig();
  if (!url || !key) throw new Error("Account access is not connected yet. Please try again shortly.");
  if (!client) client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return client;
}
