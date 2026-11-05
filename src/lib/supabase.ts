import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {sessionStorageAdapter} from "./remember-session";

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
export function authStorageKey():string {return `sb-${new URL(publicSupabaseConfig().url).hostname.split(".")[0]}-auth-token`;}
/** Local identity only unlocks this device's cache. Server requests still verify tokens. */
export function cachedSessionUser():{id:string;email?:string;user_metadata?:Record<string,unknown>}|null {
  try {const user=JSON.parse(sessionStorageAdapter.getItem(authStorageKey())??"null")?.user;
    return typeof user?.id==="string"?user:null;
  }catch{return null;}
}
export function supabase(): SupabaseClient {
  const { url, key } = publicSupabaseConfig();
  if (!url || !key) throw new Error("Account access is not connected yet. Please try again shortly.");
  if (!client) client = createClient(url, key, {
    auth: { storage:sessionStorageAdapter, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return client;
}
