"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signUpLocal, getLocalUser, loadProfile } from "@/lib/db";

export default function AuthPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    const existing = getLocalUser();
    if (existing && existing.email === email.trim()) {
      const profile = await loadProfile(existing.id);
      router.replace(profile ? "/dashboard" : "/onboarding");
      return;
    }
    const user = signUpLocal(email.trim(), name.trim());
    const profile = await loadProfile(user.id);
    router.replace(profile ? "/dashboard" : "/onboarding");
  };

  return (
    <main className="auth-layout"><section className="auth-story"><a href="/" className="auth-brand">✳ ZYNTH</a><div><p className="eyebrow">YOUR POTENTIAL, IN MOTION</p><h2>You are a<br/>work in progress.<br/><em>Make it count.</em></h2><p>Discover your strengths. Take on meaningful quests.<br/>Build the person you want to become.</p><div className="auth-orbit" aria-hidden="true"><span>✧</span></div></div><footer>SYNTHESIZE YOURSELF. REACH YOUR ZENITH.</footer></section><section className="auth-form">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <p className="eyebrow">THIS IS YOUR STARTING POINT</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">Become more.</h1>
        <p className="mt-3 text-sm text-muted">
          A small step today. A different you tomorrow.
        </p>
        <form onSubmit={submit} className="mt-10 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-edge bg-surface px-4 py-3 text-primary placeholder:text-dim"
              placeholder="First and last name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-edge bg-surface px-4 py-3 text-primary placeholder:text-dim"
              placeholder="you@somewhere.com"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !name.trim() || !email.trim()}
            className="w-full rounded-lg bg-amber py-3 font-semibold text-black transition-opacity disabled:opacity-40"
          >
            {busy ? "..." : "Enter Zynth →"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-dim">
          Local mode — your data stays on this device until you connect
          Supabase.
        </p>
      </motion.div></section>
    </main>
  );
}
