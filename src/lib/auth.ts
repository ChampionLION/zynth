import { isSupabaseConfigured, supabase } from "./supabase";
import type { AccountUser } from "./account-flow";

export { isSupabaseConfigured };
export function accountUser(user: { id:string; email?:string; user_metadata?:Record<string,unknown> }): AccountUser {
  const name = user.user_metadata?.full_name;
  return { id:user.id, email:user.email ?? "", name:typeof name === "string" && name.trim() ? name.trim() : user.email?.split("@")[0] || "Explorer" };
}
export async function getCurrentUser(): Promise<AccountUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data:sessionData, error:sessionError } = await supabase().auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  const { data, error } = await supabase().auth.getUser();
  if (error) throw error;
  return data.user ? accountUser(data.user) : null;
}
export async function signUp(email:string, password:string, name:string) {
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
  const {data,error} = await supabase().auth.signUp({ email:email.trim().toLowerCase(), password, options:{ data:{full_name:name.trim()}, emailRedirectTo:`${window.location.origin}/auth/callback` } });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}
export async function signIn(email:string,password:string) {
  const {error} = await supabase().auth.signInWithPassword({email:email.trim().toLowerCase(),password});
  if (error) throw error;
}
export async function signOut() {
  if (!isSupabaseConfigured()) return;
  const {error} = await supabase().auth.signOut({scope:"local"});
  if (error) throw error;
}
export async function sendPasswordReset(email:string) {
  const {error} = await supabase().auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}/auth/reset-password`});
  if (error) throw error;
}
export function friendlyAuthError(error:unknown): string {
  const message=error instanceof Error ? error.message : "Please try again in a moment.";
  if (/invalid login credentials/i.test(message)) return "That email and password don’t match. Please try again.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  if (/fetch|network/i.test(message)) return "We couldn’t reach your account. Check your connection and try again.";
  if (/rate|too many|security purposes/i.test(message)) return "Too many attempts. Please wait a moment before trying again.";
  return message;
}
