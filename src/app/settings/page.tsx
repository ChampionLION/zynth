"use client";

// SETTINGS — leaderboard opt-out, character name, sign out, danger zone.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireProfile } from "@/components/useRequireProfile";
import { useZynth } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { eraseProgress } from "@/lib/db";
import { signOut as signOutAccount } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { user, setProfile, reset } = useZynth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);

  if (!hydrated || !profile) return null;

  const toggleLeaderboard = async () => {
    const p = structuredClone(profile);
    p.leaderboard_opt_out = !p.leaderboard_opt_out;
    await setProfile(p);
  };

  const setCharacterName = async (name: string) => {
    const p = structuredClone(profile);
    p.character_name = name || null;
    await setProfile(p);
  };

  const signOut = async () => {
    setBusy(true);setError(null);
    try { await signOutAccount(); reset(); router.replace("/auth?mode=signin"); }
    catch {setError("We couldn’t sign you out. Please try again.");} finally {setBusy(false);}
  };
  const erase=async()=>{
    if(!user||busy)return;
    setBusy(true);setError(null);
    try { await eraseProgress(user);reset();await useZynth.getState().hydrate();router.replace("/onboarding"); }
    catch {setError("We couldn’t reset your progress. Please try again.");} finally {setBusy(false);setConfirmReset(false);}
  };

  return (
    <main className="app-page collection-page">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-xl text-muted">←</button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <section className="mt-6 space-y-3">
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Leaderboard visibility</p>
              <p className="text-xs text-muted">
                Shown as &ldquo;{profile.display_name.split(" ")[0]}{" "}
                {profile.display_name.split(" ")[1]?.[0]?.toUpperCase() ?? ""}.&rdquo; — opt out anytime
              </p>
            </div>
            <button
              onClick={toggleLeaderboard}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                profile.leaderboard_opt_out ? "bg-edge" : "bg-amber"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  profile.leaderboard_opt_out ? "left-0.5" : "left-[22px]"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-edge bg-surface p-4">
          <p className="text-sm font-medium">Character name</p>
          <input
            defaultValue={profile.character_name ?? ""}
            onBlur={(e) => setCharacterName(e.target.value.trim())}
            placeholder="Optional"
            className="mt-2 w-full rounded-lg border border-edge bg-bg px-3 py-2 text-sm placeholder:text-dim"
          />
        </div>

        <div className="rounded-xl border border-edge bg-surface p-4 text-xs text-muted">
          <p>Signed in as <span className="text-amber">{user?.email}</span></p>
          <p className="mt-1">Your profile and progress sync to your account.</p>
          <p className="mt-1">Quest feedback: {process.env.NEXT_PUBLIC_ZYNTH_MODE === "live" ? "AI feedback" : "Practice mode"}.</p>
        </div>

        <button
          onClick={signOut}
          disabled={busy}
          className="w-full rounded-xl border border-edge bg-surface px-4 py-3.5 text-left text-sm"
        >
          Sign out
        </button>

        <button
          onClick={() => setConfirmReset(true)}
          className="w-full rounded-xl border border-fail/40 bg-surface px-4 py-3.5 text-left text-sm text-fail"
        >
          Reset my progress
        </button>
      </section>
      {error&&<p role="alert" className="mt-3 text-sm text-fail">{error}</p>}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-8">
          <div className="w-full max-w-sm rounded-2xl border border-edge bg-surface p-6">
            <h3 className="font-semibold">Erase your entire profile?</h3>
            <p className="mt-2 text-sm text-muted">
              Level {profile.level}, {profile.quest_history.length} quests, everything. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-lg border border-edge py-2.5 text-sm text-muted"
              >
                Keep it
              </button>
              <button
                onClick={erase}
                disabled={busy}
                className="flex-1 rounded-lg bg-fail py-2.5 text-sm font-semibold"
              >
                Erase
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
