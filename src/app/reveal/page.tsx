"use client";

// PROFILE REVEAL — domain badge → profession → stat bars (staggered)
// → behavior signature typewriter → skill tags float in → title drop.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { DOMAIN_COLORS, display } from "@/lib/ui";
import { Typewriter } from "@/components/effects";

export default function RevealPage() {
  const router = useRouter();
  const { profile, hydrated, hydrate } = useZynth();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!profile) return;
    const timers = [
      setTimeout(() => setPhase(1), 400), // profession
      setTimeout(() => setPhase(2), 1100), // stats
      setTimeout(() => setPhase(3), 2400), // signature
      setTimeout(() => setPhase(4), 3600), // skills
      setTimeout(() => setPhase(5), 4600), // title + CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, [profile]);

  if (!hydrated) return null;
  if (!profile) {
    router.replace("/onboarding");
    return null;
  }

  const color = DOMAIN_COLORS[profile.domain];
  const statList = [
    ["Focus", profile.stats.focus],
    ["Consistency", profile.stats.consistency],
    ["Adaptability", profile.stats.adaptability],
    ["Execution", profile.stats.execution],
    [profile.stats.stat_5.name, profile.stats.stat_5.value],
    [profile.stats.stat_6.name, profile.stats.stat_6.value],
  ] as [string, number][];

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 pb-12 pt-16">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto w-fit rounded-full border px-4 py-1 text-xs tracking-[0.2em]"
          style={{ borderColor: color, color }}
        >
          {profile.domain}
        </motion.div>

        {phase >= 1 && (
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center text-3xl font-bold"
          >
            {profile.profession}
          </motion.h1>
        )}

        {phase >= 2 && (
          <div className="mt-8 space-y-3">
            {statList.map(([name, value], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-center gap-3"
              >
                <span className="w-28 text-xs text-muted">{display(name)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 10) * 100}%` }}
                    transition={{ delay: i * 0.12 + 0.1, duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-semibold">{value}</span>
              </motion.div>
            ))}
          </div>
        )}

        {phase >= 3 && (
          <div className="mt-8 text-center">
            <p className="text-[10px] tracking-widest text-dim">BEHAVIOR SIGNATURE</p>
            <p className="mt-1 font-mono text-lg text-amber">
              <Typewriter text={display(profile.behavior_signature)} speed={40} />
            </p>
          </div>
        )}

        {phase >= 4 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {profile.skills.map((s, i) => (
              <motion.span
                key={s.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="rounded-full border border-edge bg-surface px-3 py-1 font-mono text-xs text-amber"
              >
                {display(s.name)}
              </motion.span>
            ))}
          </div>
        )}

        {phase >= 5 && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="mx-auto mt-10 w-fit rounded-lg bg-purple px-5 py-2 text-sm font-semibold"
            >
              {profile.title} · Level {profile.level}
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => router.replace("/dashboard")}
              className="mt-8 w-full rounded-lg bg-amber py-3 font-semibold text-black"
            >
              Begin →
            </motion.button>
          </>
        )}
      </div>
    </main>
  );
}
