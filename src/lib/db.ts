// ─── Data layer ──────────────────────────────────────────────────
// Mock mode: localStorage. Live mode: Supabase (profiles table JSON).
// Same interface either way, switched by NEXT_PUBLIC_ZYNTH_MODE.

import type { Profile, Quest } from "./types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LS_PROFILE = "zynth_profile";
const LS_QUEST = "zynth_active_quest";
const LS_USER = "zynth_user";
const LS_ACCOUNT = "zynth_account";

export function isLive(): boolean {
  return (
    process.env.NEXT_PUBLIC_ZYNTH_MODE === "live" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let _supabase: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// ── Mock auth (localStorage user) ────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  name: string;
}

export function getLocalUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_USER);
  return raw ? (JSON.parse(raw) as MockUser) : null;
}

export function signUpLocal(email: string, name: string): MockUser {
  const saved = localStorage.getItem(LS_ACCOUNT);
  if (saved) {
    try { const account = JSON.parse(saved) as MockUser;
      if (account.email.toLowerCase() === email.toLowerCase()) { localStorage.setItem(LS_USER, saved); return account; }
    } catch { /* Ignore an invalid saved identity. */ }
  }
  const user: MockUser = {
    id: crypto.randomUUID(),
    email,
    name,
  };
  localStorage.setItem(LS_USER, JSON.stringify(user));
  localStorage.setItem(LS_ACCOUNT, JSON.stringify(user));
  return user;
}

export function signOutLocal(): void {
  const account = localStorage.getItem(LS_USER);
  if (account) localStorage.setItem(LS_ACCOUNT, account);
  localStorage.removeItem(LS_USER);
}

export function eraseLocalData(): void {
  localStorage.removeItem(LS_USER);
  localStorage.removeItem(LS_ACCOUNT);
  localStorage.removeItem(LS_PROFILE);
  localStorage.removeItem(LS_QUEST);
}

// ── Profile persistence ──────────────────────────────────────────

export async function loadProfile(userId: string): Promise<Profile | null> {
  if (isLive()) {
    const { data, error } = await supabase()
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToProfile(data) : null;
  }
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_PROFILE);
  if (!raw) return null;
  const p = JSON.parse(raw) as Profile;
  return p.user_id === userId ? p : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  profile.updated_at = new Date().toISOString();
  if (isLive()) {
    const { error } = await supabase().from("profiles").upsert(profileToRow(profile), {
      onConflict: "user_id",
    });
    if (error) throw error;
    return;
  }
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
}

// ── Active quest persistence ─────────────────────────────────────

export async function loadActiveQuest(userId: string): Promise<Quest | null> {
  if (isLive()) {
    const { data, error } = await supabase()
      .from("quests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...(data.quest_data as Quest), id: data.id, status: data.status };
  }
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_QUEST);
  return raw ? (JSON.parse(raw) as Quest) : null;
}

export async function saveActiveQuest(userId: string, quest: Quest | null): Promise<void> {
  if (isLive()) {
    if (!quest) {
      const { error } = await supabase().from("quests").update({status:"completed"}).eq("user_id",userId).eq("status","active");
      if (error) throw error;
      return;
    }
    if (quest) {
      const { error: retireError } = await supabase().from("quests").update({status:"expired"}).eq("user_id",userId).eq("status","active").neq("id",quest.id);
      if (retireError) throw retireError;
      const { error } = await supabase().from("quests").upsert({
        id: quest.id,
        user_id: userId,
        quest_data: quest,
        quest_type: quest.type,
        difficulty: quest.difficulty,
        status: quest.status,
        is_multi_step: quest.steps.length > 0,
        steps: quest.steps,
        created_at: quest.created_at,
      });
      if (error) throw error;
    }
    return;
  }
  if (quest) localStorage.setItem(LS_QUEST, JSON.stringify(quest));
  else localStorage.removeItem(LS_QUEST);
}

// ── Supabase row mapping ─────────────────────────────────────────

function rowToProfile(row: Record<string, unknown>): Profile {
  // Profile fields map 1:1 onto columns; JSON blobs come back parsed.
  return row as unknown as Profile;
}

function profileToRow(profile: Profile): Record<string, unknown> {
  return { ...profile };
}

