"use client";

// DASHBOARD — top bar, daily pop-up (energy + profiling question),
// character area, quest card, mini stats.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { useRequireProfile } from "@/components/useRequireProfile";
import { OverviewMapBackground } from "@/components/WorldMap";
import { BottomNav } from "@/components/BottomNav";
import { DifficultyPips, Particles } from "@/components/effects";
import { DOMAIN_COLORS, domainColor, display } from "@/lib/ui";
import { resolveQuestPlan, todayStr, daysSince } from "@/lib/engines/quest";
import { detectUserState, STATE_PROMPT_INJECTIONS } from "@/lib/engines/adaptive";
import { generateQuest, getDailyQuestion } from "@/lib/llm/client";
import type { DailyQuestion, Quest } from "@/lib/types";
import {missionProgress,plannedQuestId} from "@/lib/engines/quest-cycle";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { activeQuest, createPlannedQuest, setProfile, eventQueue,gradeReveal,mode,journeyAction } = useZynth();
  const generationLock = useRef(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [dailyChecked, setDailyChecked] = useState(false);
  const [dailyQ, setDailyQ] = useState<DailyQuestion | null>(null);
  const [dailyBusy,setDailyBusy]=useState(false),[dailyError,setDailyError]=useState("");
  const [popupStage, setPopupStage] = useState<"energy" | "question" | "done">("done");

  // events pending? play them first
  useEffect(() => {
    if(gradeReveal)router.replace("/grade");
    else if (eventQueue.length > 0) router.replace("/events");
  }, [gradeReveal,eventQueue.length, router]);
  const questionRequest=useRef<Promise<DailyQuestion|null>|null>(null);
  const dailyQuestion=async(p:typeof profile)=>{
    if(mode!=="trusted")return p?getDailyQuestion(p):null;
    if(questionRequest.current)return questionRequest.current;
    const request=journeyAction({kind:"daily_question"}).then(result=>result.question??null);questionRequest.current=request;
    try{return await request;}finally{if(questionRequest.current===request)questionRequest.current=null;}
  };

  // Daily pop-up: energy check + profiling question, once per day
  useEffect(() => {
    if (!profile) return;
    const today = todayStr();
    if (profile.energy_date !== today) {
      setPopupStage("energy");
      setDailyChecked(true);
    } else {
      const answeredToday = profile.continuous_profile_answers.some(
        (a) => a.answered_at.slice(0, 10) === today
      );
      if (!answeredToday) {
        void dailyQuestion(profile).then((q) => {
          if (q) {
            setDailyQ(q);
            setPopupStage("question");
          } else setPopupStage("done");
          setDailyChecked(true);
        }).catch(()=>{setPopupStage("done");setDailyChecked(true);});
      } else { setPopupStage("done"); setDailyChecked(true); }
    }
  }, [profile?.energy_date, profile?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTodaysQuest = async () => {
    if (!profile || generationLock.current) return;
    generationLock.current = true;
    setGenerationError(false);
    setGenerating(true);
    try {
    if(mode==="trusted"){await journeyAction({kind:"generate"});return;}
    // refresh adaptive state before generation
    const p = structuredClone(profile);
    const detected = detectUserState(p);
    p.current_adaptive_state = detected.state;
    const { questType, difficulty } = resolveQuestPlan(p);
    const generated = await generateQuest(
      p,
      questType,
      difficulty,
      STATE_PROMPT_INJECTIONS[detected.state]
    );
    const quest: Quest = {
      ...generated,
      id: await plannedQuestId(p.user_id,questType,missionProgress(p).cycle,questType==="mission"?missionProgress(p).attempts:p.quest_history.filter(q=>q.completed_at.slice(0,10)===todayStr()&&q.quest_type!=="mission").length,todayStr()),
      status: "active",
      created_at: new Date().toISOString(),
      date: todayStr(),
    };
    const latest = useZynth.getState().profile;
    if (!latest || latest.user_id !== p.user_id) return;
    await createPlannedQuest(quest,p.user_id);
    } catch { setGenerationError(true); } finally { generationLock.current = false; setGenerating(false); }
  };

  // auto-generate quest for today if none
  useEffect(() => {
    if (!profile || !hydrated) return;
    if (!dailyChecked || generationError || popupStage !== "done") return;
    const doneToday = profile.last_quest_date === todayStr();
    if (!activeQuest && (!doneToday||missionProgress(profile).eligible) && !generating) {
      void generateTodaysQuest();
    }
    // Keep unfinished challenges and their drafts, including missions after a break.
  }, [profile, hydrated, activeQuest, popupStage, dailyChecked, generationError]); // eslint-disable-line react-hooks/exhaustive-deps

  const characterState = useMemo(() => {
    if (!profile) return "active";
    const absent = daysSince(profile.last_active);
    const trailing = profile.quest_history.slice(-3);
    if (absent >= 3) return "returning";
    if (trailing.length === 3 && trailing.every((q) => q.grade === "Excellent")) return "peak";
    if (profile.streak >= 7) return "streak";
    if (profile.last_quest_date === todayStr()) return "active";
    return "idle";
  }, [profile]);

  if (!hydrated || !profile) return null;

  const color = DOMAIN_COLORS[profile.domain];
  const expPct = Math.min(100, (profile.exp / profile.exp_to_next) * 100);
  const doneToday = profile.last_quest_date === todayStr();
  const mission=missionProgress(profile,activeQuest);

  const answerEnergy = async (level: "high" | "mid" | "low") => {
    if(dailyBusy)return;
    if(mode==="trusted"){
      setDailyBusy(true);setDailyError("");
      try{await journeyAction({kind:"energy",energy:level});const q=await dailyQuestion(profile);if(q){setDailyQ(q);setPopupStage("question");}else setPopupStage("done");}
      catch{setDailyError("We couldn’t save this check-in. Please try again, or choose Not now.");}finally{setDailyBusy(false);}
      return;
    }
    const p = structuredClone(profile);
    p.energy_today = level;
    p.energy_date = todayStr();
    await setProfile(p);
    const q = await getDailyQuestion(p);
    if (q) {
      setDailyQ(q);
      setPopupStage("question");
    } else setPopupStage("done");
  };

  const answerDaily = async (key: string | null) => {
    if (!dailyQ) return setPopupStage("done");
    if(mode==="trusted"){
      if(dailyBusy)return;setDailyBusy(true);setDailyError("");
      try{await journeyAction({kind:"answer_daily",answer:key});setPopupStage("done");}catch{setDailyError("We couldn’t save this answer. Please try again.");}finally{setDailyBusy(false);}
      return;
    }
    const p = structuredClone(profile);
    p.continuous_profile_answers.push({
      question: dailyQ.question,
      category: dailyQ.category,
      answer_key: key,
      answer_label: key
        ? dailyQ.options.find((o) => o.key === key)?.label ?? null
        : null,
      signals_mined: dailyQ.signals_mined,
      answered_at: new Date().toISOString(),
    });
    await setProfile(p);
    setPopupStage("done");
  };

  return (
    <main className="app-page dashboard-page">
<OverviewMapBackground profile={profile} />
<header className="workspace-header"><span>YOUR PERSONAL EVOLUTION</span><span>{new Date().toLocaleDateString(undefined, {weekday:"long",month:"short",day:"numeric"})}</span></header>
<div className="dashboard-heading"><div><p className="eyebrow">THE NEXT VERSION OF YOU</p><h1>Keep becoming.</h1><p>Welcome back, {profile.display_name.split(" ")[0]}. Make today a turning point.</p></div><button className="quiet-link" onClick={()=>router.push("/profile")}>Your identity ↗</button></div>
<div className="overview-strip"><div><span>Current level</span><strong>{profile.level}<small>{profile.title}</small></strong></div><div><span>Day streak</span><strong>{profile.streak}<small>days of momentum</small></strong></div><div><span>Quests completed</span><strong>{profile.quest_history.length}<small>marks made</small></strong></div><div><span>Total experience</span><strong>{profile.cumulative_exp.toLocaleString()}<small>EXP earned</small></strong></div></div>
<div className="dashboard-grid"><section><div className="section-label"><h2>Your next move</h2><span>ONE QUEST. REAL PROGRESS.</span></div>
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple px-3 py-1 text-xs font-bold">
            Lv {profile.level}
          </span>
          <span className="text-sm text-amber">{profile.title}</span>
          {profile.prestige > 0 && (
            <span className="rounded-full border border-gold px-2 py-0.5 text-[10px] text-gold">
              P{profile.prestige}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-amber">
          {profile.streak > 0 ? (
            <>
              <span>🔥</span>
              <span className="text-sm font-semibold">{profile.streak}</span>
            </>
          ) : (
            <span className="text-dim">—</span>
          )}
        </div>
      </div>
      {/* EXP bar */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-purple/30">
        <motion.div
          animate={{ width: `${expPct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className="h-full rounded-full bg-amber"
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-dim">
        {profile.exp} / {profile.exp_to_next} EXP
      </p>

      {/* QUEST CARD */}
      <p className="mission-progress" role="status">{mission.activeQuestId?"Your mission is ready to continue.":mission.eligible?"Your next mission is unlocked.":`${mission.progress} of 7 qualifying quests toward your next mission.`} <span>Streaks and story chapters progress separately.</span></p>
      <div className="quest-feature">
        {doneToday && !activeQuest && !mission.eligible ? (
          <div className="py-6 text-center">
            <p className="text-2xl">✓</p>
            <p className="mt-2 font-semibold">Today&apos;s mark is complete.</p>
            <p className="mt-1 text-sm text-muted">
              Your progress is saved. Take a breath and come back tomorrow.
            </p>
          </div>
        ) : generationError ? (<div role="alert"><p>We couldn’t prepare your quest.</p><button onClick={()=>void generateTodaysQuest()} className="mt-4 text-amber">Try again →</button></div>) : generating || !activeQuest ? (
          <div className="space-y-3 py-2">
            <div className="shimmer h-4 w-2/3 rounded" />
            <div className="shimmer h-8 w-full rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
            <p className="pt-2 text-center text-xs text-dim">
              Forging today&apos;s quest...
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm italic text-amber/90">
              {activeQuest.flavor_text}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">{activeQuest.quest_title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">{activeQuest.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
              <DifficultyPips difficulty={activeQuest.difficulty} />
              <span>{activeQuest.estimated_time}</span>
              <span className="rounded-full border border-edge px-2 py-0.5 uppercase tracking-wider">
                {activeQuest.type}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeQuest.skills_targeted.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[11px] text-amber"
                >
                  {display(s)}
                </span>
              ))}
            </div>
            <button
              onClick={() => router.push("/quest")}
              className="mt-4 w-full rounded-lg bg-amber py-3 font-semibold text-black"
            >
              Begin Quest →
            </button>
          </>
        )}
      </div>

      <div className="section-label mt-8"><h2>Your attributes</h2><span>BUILT THROUGH ACTION</span></div>
      <dl aria-label="Your attributes" className="overview-attributes mt-4 grid grid-cols-2 gap-3">
        {(
          [
            ["Focus", profile.stats.focus],
            ["Consistency", profile.stats.consistency],
            ["Adaptability", profile.stats.adaptability],
            ["Execution", profile.stats.execution],
            [profile.stats.stat_5.name, profile.stats.stat_5.value],
            [profile.stats.stat_6.name, profile.stats.stat_6.value],
          ] as [string, number][]
        ).map(([name, value],index) => (
          <div key={index} className="rounded-xl border border-edge bg-surface px-4 py-3">
            <dt className="text-[11px] text-muted">{display(name)}</dt>
            <dd className="text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

<section className="journey-card"><p className="eyebrow">EVERY MARK MATTERS</p><h2>A little further, every day.</h2><p>Your journey is built one deliberate action at a time.</p><button className="quiet-link" onClick={()=>router.push("/markmap")}>Explore your Mark Map →</button></section></section><aside className="dashboard-aside"><section className="identity-card"><div className="section-label"><h2>Your synthesis</h2><span>● {display(characterState)}</span></div>      {/* CHARACTER AREA */}
      <div className="relative mt-4 flex h-44 items-center justify-center">
        {(characterState === "peak" || characterState === "streak") && (
          <Particles count={8} color={characterState === "peak" ? "#FFD700" : "#C87D2F"} />
        )}
        <motion.div
          animate={{
            scale: characterState === "peak" ? [1, 1.04, 1] : 1,
            opacity: 1,
          }}
          transition={{ repeat: characterState === "peak" ? Infinity : 0, duration: 2 }}
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle, ${domainColor(profile.domain,.2)} 0%, transparent 70%)`,
            filter:
              characterState === "active" || characterState === "peak" || characterState === "streak"
                ? `drop-shadow(0 0 20px ${domainColor(profile.domain,.53)})`
                : "none",
          }}
        >
          {/* silhouette */}
          <svg viewBox="0 0 64 64" className="h-20 w-20" fill={color} opacity={0.9}>
            <circle cx="32" cy="18" r="10" />
            <path d="M32 30c-11 0-18 8-18 20v6h36v-6c0-12-7-20-18-20z" />
          </svg>
          {characterState === "streak" && (
            <div className="absolute inset-0 rounded-full border-2 border-amber/40" />
          )}
        </motion.div>
        <span className="absolute bottom-0 font-mono text-xs text-amber">
          {display(profile.behavior_signature)}
        </span>
      </div>

<p className="eyebrow mt-6">{profile.domain} DOMAIN</p><h2 className="mt-2 text-xl font-semibold">{profile.profession}</h2><p className="mt-3 text-sm leading-relaxed text-muted">Your identity evolves with every challenge you take on.</p></section><section className="resource-card"><p className="eyebrow">READY WHEN YOU ARE</p><div><span>Skip tokens</span><strong>◈ {profile.tokens}</strong></div><div><span>XP cards</span><strong>▱ {profile.xp_cards}</strong></div><button className="quiet-link" onClick={()=>router.push("/achievements")}>View achievements ↗</button></section><p className="aside-quote">“You don’t consume Zynth.<br/>You perform in it.”</p></aside></div>
      {/* DAILY POP-UP */}
      <AnimatePresence>
        {popupStage !== "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 120, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl border-t border-edge bg-surface p-6 pb-10"
            >
              {popupStage === "energy" ? (
                <>
                  <button disabled={dailyBusy} onClick={()=>{setDailyError("");setPopupStage("done");}} className="mb-4 block ml-auto text-xs text-muted">Not now ×</button><p className="text-center text-sm text-muted">
                    Before anything — how&apos;s the engine today?
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    {(
                      [
                        ["high", "⚡", "HIGH"],
                        ["mid", "〰️", "MID"],
                        ["low", "🌙", "LOW"],
                      ] as const
                    ).map(([key, icon, label]) => (
                      <button
                        key={key}
                        disabled={dailyBusy}
                        onClick={() => answerEnergy(key)}
                        className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-edge bg-bg py-4 transition-colors hover:border-amber"
                      >
                        <span className="text-2xl">{icon}</span>
                        <span className="text-xs text-muted">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : dailyQ ? (
                <>
                  <p className="text-center text-[10px] tracking-widest text-dim">
                    A QUICK ONE
                  </p>
                  <p className="mt-2 text-center text-sm font-medium">
                    {dailyQ.question}
                  </p>
                  <div className="mt-4 space-y-2">
                    {dailyQ.options.map((o) => (
                      <button
                        key={o.key}
                        disabled={dailyBusy}
                        onClick={() => answerDaily(o.key)}
                        className="w-full rounded-lg border border-edge bg-bg px-4 py-3 text-left text-sm text-muted transition-colors hover:border-amber hover:text-primary"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={dailyBusy}
                    onClick={() => answerDaily(null)}
                    className="mt-3 w-full text-center text-xs text-dim"
                  >
                    skip
                  </button>
                </>
              ) : null}
              {dailyError&&<p role="alert" className="mt-3 text-xs text-amber">{dailyError}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
