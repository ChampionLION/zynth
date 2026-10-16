"use client";

// EVENT QUEUE — plays queued event screens in order:
// LEVEL UP → SKILL EVOLUTION → HIDDEN SKILL → STREAK → WEAKNESS OVERCOME → ACHIEVEMENT

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { Particles, Typewriter, CountUp } from "@/components/effects";
import { display } from "@/lib/ui";
import type { ZynthEvent } from "@/lib/types";

export default function EventsPage() {
  const router = useRouter();
  const { eventQueue,ackEvent } = useZynth();
  const current=eventQueue[0]??null;
  const [busy,setBusy]=useState(false),[error,setError]=useState("");

  useEffect(() => {
    if (!current) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const advance = async () => {if(busy)return;setBusy(true);setError("");try{await ackEvent();}catch{setError("We couldn’t save your place. Please try again.");}finally{setBusy(false);}};

  if (!current) return <main className="min-h-dvh" />;

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={JSON.stringify(current)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative flex min-h-dvh flex-col items-center justify-center px-8"
      >
        <fieldset className="contents" disabled={busy} aria-busy={busy}><EventScreen event={current} onContinue={()=>void advance()} /></fieldset>
        {error&&<p role="alert" className="mt-3 text-xs text-amber">{error}</p>}
      </motion.main>
    </AnimatePresence>
  );
}

function ContinueBtn({ onClick, delay = 1.5 }: { onClick: () => void; delay?: number }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      onClick={onClick}
      className="mt-10 w-full max-w-xs rounded-lg bg-amber py-3 font-semibold text-black"
    >
      Continue →
    </motion.button>
  );
}

function EventScreen({ event, onContinue }: { event: ZynthEvent; onContinue: () => void }) {
  switch (event.kind) {
    case "level_up":
      return (
        <>
          <Particles count={12} color="#534AB7" />
          <p className="text-xs tracking-[0.3em] text-purple">LEVEL UP</p>
          <div className="mt-6 flex items-end gap-4">
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.25 }}
              transition={{ delay: 0.6 }}
              className="text-3xl text-dim"
            >
              {event.from}
            </motion.span>
            <motion.span
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 12 }}
              className="text-8xl font-black text-purple"
            >
              {event.to}
            </motion.span>
          </div>
          {event.newTitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-4 text-xl text-amber"
            >
              {event.newTitle}
            </motion.p>
          )}
          {event.unlocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-4 space-y-1 text-center"
            >
              {event.unlocks.map((u) => (
                <p key={u} className="text-sm text-teal">
                  ✦ {u} unlocked
                </p>
              ))}
            </motion.div>
          )}
          <ContinueBtn onClick={onContinue} />
        </>
      );

    case "skill_evolution":
      return (
        <>
          <p className="text-xs tracking-[0.3em] text-teal">SKILL EVOLUTION</p>
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 font-mono text-lg text-muted line-through"
          >
            {display(event.oldName)}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="mt-3 font-mono text-3xl font-bold text-teal"
          >
            {display(event.newName)}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-4 text-sm text-muted"
          >
            Tier {event.tier - 1} → Tier {event.tier}
          </motion.p>
          <ContinueBtn onClick={onContinue} delay={2.2} />
        </>
      );

    case "hidden_skill":
      return (
        <>
          <p className="font-mono text-sm tracking-[0.2em] text-primary">
            <Typewriter text="NEW SKILL DISCOVERED" speed={60} />
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8 text-4xl font-bold text-amber glow-amber"
          >
            {display(event.skill)}
          </motion.p>
          <p className="mt-6 max-w-sm text-center text-sm leading-relaxed text-muted">
            <Typewriter text={event.message} speed={20} startDelay={2600} />
          </p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5 }}
            className="mt-8 rounded-full border border-teal/50 px-4 py-1 text-sm text-teal"
          >
            +5 XP Cards
          </motion.p>
          <ContinueBtn onClick={onContinue} delay={5} />
        </>
      );

    case "streak_milestone":
      return (
        <>
          <motion.span
            initial={{ scale: 1 }}
            animate={{ scale: 2 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
            className="text-5xl"
          >
            🔥
          </motion.span>
          <p className="mt-8 text-6xl font-black text-amber">
            <CountUp to={event.streak} />
          </p>
          <p className="mt-2 text-sm tracking-widest text-muted">DAY STREAK</p>
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="mt-6 rounded-lg bg-amber px-4 py-2 font-bold text-black"
          >
            {event.multiplier}× EXP
          </motion.div>
          {event.tokenAwarded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-4 text-sm text-teal"
            >
              ◈ +1 Skip Token
            </motion.p>
          )}
          <ContinueBtn onClick={onContinue} />
        </>
      );

    case "weakness_overcome":
      return (
        <>
          <motion.div
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: "inset 0 0 80px rgba(200,125,47,0.4)" }}
          />
          <p className="text-xs tracking-[0.3em] text-amber">PATTERN BROKEN</p>
          <p className="mt-8 font-mono text-sm text-dim line-through">
            {display(event.oldSignature)}
          </p>
          <p className="mt-2 font-mono text-2xl text-amber">
            <Typewriter text={display(event.newSignature)} speed={50} startDelay={800} />
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-6 text-sm text-teal"
          >
            +3 permanent to {event.stat}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.4 }}
            className="mt-4 rounded-full border border-amber px-4 py-1 text-xs tracking-widest text-amber"
          >
            PATTERN BROKEN
          </motion.div>
          <ContinueBtn onClick={onContinue} delay={2.8} />
        </>
      );

    case "achievement":
      return (
        <>
          <Particles count={10} color="#FFD700" />
          <p className="text-xs tracking-[0.3em] text-muted">ACHIEVEMENT</p>
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
            className="mt-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold bg-surface text-4xl"
          >
            ★
          </motion.div>
          <p className="mt-6 text-2xl font-bold text-gold">{event.name}</p>
          <p className="mt-1 text-xs tracking-widest text-muted">{event.rarity.toUpperCase()}</p>
          {event.cards > 0 && (
            <p className="mt-4 text-sm text-teal">⬡ +{event.cards} XP Cards</p>
          )}
          <ContinueBtn onClick={onContinue} />
        </>
      );

    case "profession_evolution":
      return (
        <>
          <Particles count={12} color="#C87D2F" />
          <p className="text-xs tracking-[0.3em] text-amber">PROFESSION EVOLUTION</p>
          <p className="mt-8 text-lg text-dim line-through">{event.from}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="mt-3 text-3xl font-bold text-amber"
          >
            {event.to}
          </motion.p>
          <p className="mt-6 max-w-xs text-center text-sm text-muted">
            The leaderboard noticed before you did.
          </p>
          <ContinueBtn onClick={onContinue} />
        </>
      );
  }
}
