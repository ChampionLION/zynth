"use client";

// PRESTIGE — Level 100+ voluntary reset.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRequireProfile } from "@/components/useRequireProfile";
import { useZynth } from "@/lib/store";
import { applyPrestige } from "@/lib/engines/progression";
import { Particles } from "@/components/effects";

export default function PrestigePage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { setProfile,mode,journeyAction } = useZynth();
  const [requestId]=useState(()=>crypto.randomUUID());
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  if (!hydrated || !profile) return null;
  if (profile.level < 100 && !done) {
    router.replace("/profile");
    return null;
  }

  const doPrestige = async () => {
    if(busy)return;setBusy(true);setError("");
    try{
      if(mode==="trusted")await journeyAction({kind:"prestige",requestId});
      else await setProfile(applyPrestige(profile));
      setDone(true);
    }catch{setError("We couldn’t save this change. Please try again.");}finally{setBusy(false);}
  };

  if (done) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center px-8">
        <Particles count={14} color="#FFD700" />
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="text-5xl"
        >
          ✦
        </motion.p>
        <h1 className="mt-6 text-3xl font-bold text-gold">Reborn</h1>
        <p className="mt-3 max-w-xs text-center text-sm text-muted">
          Level 1 again — but nothing about you is the same. Permanent EXP bonus:
          ×{profile.prestige_exp_bonus.toFixed(2)}.
        </p>
        <button
          onClick={() => router.replace("/dashboard")}
          className="mt-10 w-full max-w-xs rounded-lg bg-amber py-3 font-semibold text-black"
        >
          Begin again →
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pt-6">
      <button onClick={() => router.back()} className="self-start text-xl text-muted">←</button>
      <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <p className="text-5xl">✦</p>
        <h1 className="mt-4 text-2xl font-bold text-gold">Prestige</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Reset to Level 1. Stats soft-reset to your foundation +2 per prestige.
          Skills keep their evolved names but return to Level 1.
        </p>
        <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl border border-edge bg-surface p-4 text-left text-sm">
          <p className="flex justify-between">
            <span className="text-muted">Permanent EXP bonus</span>
            <span className="text-gold">×{(1 + (profile.prestige + 1) * 0.25).toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted">XP Cards</span>
            <span className="text-teal">+15</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted">Prestige badge</span>
            <span className="text-gold">P{profile.prestige + 1}</span>
          </p>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-8 w-full max-w-xs rounded-lg border border-gold py-3 font-semibold text-gold"
          >
            I&apos;m ready
          </button>
        ) : (
          <div className="mt-8 w-full max-w-xs">
            <p className="text-xs text-fail">
              Level {profile.level} → 1. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border border-edge py-3 text-sm text-muted"
              >
                Not yet
              </button>
              <button disabled={busy}
                onClick={doPrestige}
                className="flex-1 rounded-lg bg-gold py-3 text-sm font-bold text-black"
              >
                Prestige ✦
              </button>
            </div>
          </div>
        )}
        {error&&<p role="alert" className="mt-4 text-xs text-amber">{error}</p>}
      </div>
    </main>
  );
}
