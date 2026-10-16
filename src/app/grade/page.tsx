"use client";

// GRADE REVEAL — timed sequence per blueprint UI spec.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { GRADE_COLORS } from "@/lib/ui";
import { CountUp } from "@/components/effects";

export default function GradeRevealPage() {
  const router = useRouter();
  const { gradeReveal, eventQueue, ackGrade, profile } = useZynth();
  const [t, setT] = useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");

  useEffect(() => {
    const timers = [400, 700, 1000, 1300, 1600, 1800, 2200].map((ms, i) =>
      setTimeout(() => setT(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!gradeReveal || !profile) {
    if (typeof window !== "undefined") router.replace("/dashboard");
    return null;
  }

  const { gradeResult, expEarned, streakMultiplier, changedStats } = gradeReveal;
  const colors = GRADE_COLORS[gradeResult.grade];

  const cont = async () => {
    if(busy)return;setBusy(true);setError("");
    try{await ackGrade();router.replace(eventQueue.length > 0 ? "/events" : "/dashboard");}
    catch{setError("We couldn’t save your place. Please try again.");setBusy(false);}
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 pb-10">
      {/* GRADE CARD */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="w-full rounded-2xl border-2 bg-surface px-8 py-10 text-center"
        style={{ borderColor: colors.border }}
      >
        <p
          className={`text-4xl font-black tracking-wide ${
            gradeResult.grade === "Excellent" ? "glow-gold" : ""
          }`}
          style={{ color: colors.text }}
        >
          {gradeResult.grade}
        </p>

        {t >= 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 text-lg font-bold text-primary"
          >
            {gradeResult.mentor_line}
          </motion.p>
        )}

        {t >= 2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-muted"
          >
            {gradeResult.feedback}
          </motion.p>
        )}

        {t >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <CountUp
              to={expEarned}
              prefix="+"
              suffix=" EXP"
              className="text-2xl font-bold text-amber"
            />
            {streakMultiplier > 1 && (
              <p className="mt-1 text-xs text-amber/80">
                {streakMultiplier}× streak
              </p>
            )}
          </motion.div>
        )}

        {t >= 4 && changedStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex justify-center gap-4"
          >
            {changedStats.map((s) => (
              <span key={s} className="text-sm">
                <span className="text-teal">↑</span>{" "}
                <span className="capitalize text-muted">{s}</span>
              </span>
            ))}
          </motion.div>
        )}

        {t >= 5 && gradeResult.strengths.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {gradeResult.strengths.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[11px] text-teal"
              >
                {s}
              </motion.span>
            ))}
          </div>
        )}

        {t >= 6 && gradeResult.improvements.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {gradeResult.improvements.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] text-amber"
              >
                {s}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>

      {t >= 7 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={()=>void cont()} disabled={busy}
          className="mt-8 w-full max-w-sm rounded-lg bg-amber py-3 font-semibold text-black"
        >
          Continue →
        </motion.button>
      )}
      {error&&<p role="alert" className="mt-3 text-xs text-amber">{error}</p>}
    </main>
  );
}
