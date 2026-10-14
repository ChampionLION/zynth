"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ONBOARDING_QUESTIONS, buildProfile, normalizeAspiration, validateOnboardingAnswers } from "@/lib/engines/onboarding";
import { classifyOnboarding } from "@/lib/llm/client";
import { getLocalUser } from "@/lib/db";
import { useZynth } from "@/lib/store";
import { Particles } from "@/components/effects";
import type { OnboardingAnswers } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useZynth(s => s.setProfile);
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = ONBOARDING_QUESTIONS[step];
  const selected = answers[q.id] ?? [];
  const normalizedGoal = normalizeAspiration(goal);
  const canContinue = step === 0 ? normalizedGoal.length >= 2 && /\p{L}/u.test(normalizedGoal) : selected.length > 0;

  useEffect(() => {
    if (!getLocalUser()) router.replace("/auth");
  }, [router]);

  const toggle = (key: string) => {
    setError(null);
    setAnswers(previous => {
      const picks = previous[q.id] ?? [];
      const next = picks.includes(key) ? picks.filter(p => p !== key) : picks.length === 2 ? [picks[0], key] : [...picks, key];
      return { ...previous, [q.id]: next };
    });
  };

  const next = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canContinue || lock.current) return;
    setError(null);
    const updated = { ...answers, Q1: [normalizedGoal] };
    setAnswers(updated);
    if (step < 4) { setStep(step + 1); return; }
    lock.current = true;
    const user = getLocalUser();
    if (!user) { lock.current = false; router.replace("/auth"); return; }
    setSynthesizing(true);
    try {
      const complete = validateOnboardingAnswers(updated as OnboardingAnswers);
      const result = await classifyOnboarding(complete);
      await setProfile(buildProfile(user.id, user.name, result, complete.Q1[0]));
      router.replace("/reveal");
    } catch (e) {
      setSynthesizing(false);
      setError(e instanceof Error ? e.message : "We couldn’t prepare your profile. Your answers are still here; try again.");
    } finally { lock.current = false; }
  };

  if (synthesizing) return <main className="onboarding-loading"><Particles count={12} /><div className="synthesis-symbol" aria-hidden="true">✳</div><p className="eyebrow">SETTING YOUR STARTING POINT</p><h1>A path toward {normalizedGoal.toLowerCase() === "still exploring" ? "what comes next" : normalizedGoal}.</h1><p>Matching your direction with the way you approach things.</p><span role="status">Preparing your profile…</span></main>;

  return <main className="onboarding-layout">
    <aside className="onboarding-story">
      <Link href="/auth" className="auth-brand">✳ ZYNTH</Link>
      <div className="onboarding-story-copy"><p className="eyebrow">START WITH A DIRECTION</p><h1>Your next chapter<br/>starts with <em>you.</em></h1><p>One destination. Four everyday decisions.<br/>A starting point that can evolve with you.</p></div>
      <div className="onboarding-route" aria-hidden="true"><svg viewBox="0 0 380 210"><path d="M25 165 C60 165 55 65 120 70 S170 190 220 140 S270 50 350 55" fill="none" stroke="currentColor" strokeDasharray="4 7" />{[[25,165],[120,70],[185,153],[257,78],[350,55]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===step?14:9} className={i<=step?"route-reached":"route-future"}/><text x={x} y={y+4} textAnchor="middle">{i+1}</text></g>)}</svg><span>{normalizedGoal || "Your destination is yours to name."}</span></div>
      <p className="onboarding-footnote">No right answers. No personal history required.</p>
    </aside>
    <section className="onboarding-content">
      <div className="onboarding-topline"><span>YOUR STARTING POINT</span><span>STEP {step + 1} OF 5</span></div>
      <div className="onboarding-progress" aria-label={`Step ${step+1} of 5`}>{ONBOARDING_QUESTIONS.map((question,i)=><span key={question.id} className={i<=step?"reached":""}/>)}</div>
      <form onSubmit={next}>
        <AnimatePresence mode="wait" onExitComplete={()=>heading.current?.focus()}>
          <motion.div key={q.id} initial={reducedMotion?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={reducedMotion?{}:{opacity:0,y:-8}} transition={{duration:.18}}>
            <p className="eyebrow">{q.chapter}</p>
            <h2 ref={heading} tabIndex={-1} className="onboarding-question" id="question-heading">{q.prompt}</h2>
            <p className="onboarding-context" id="question-context">{q.context}</p>
            {q.kind === "aspiration" ? <div className="aspiration-entry">
              <label htmlFor="aspiration">Your direction</label>
              <input id="aspiration" name="aspiration" value={goal} onChange={e=>{setGoal(e.target.value);setError(null);}} maxLength={120} placeholder="e.g. Animator, founder, or a better storyteller" autoComplete="off" aria-describedby="aspiration-help" />
              <div className="aspiration-help" id="aspiration-help"><span>You can be specific, or keep it open.</span><span>{goal.length}/120</span></div>
              <p className="suggestion-label">OR START HERE</p><div className="aspiration-suggestions">{q.options.map(o=><button type="button" key={o.key} aria-pressed={normalizedGoal===o.key} className={normalizedGoal===o.key?"chosen":""} onClick={()=>setGoal(o.key)}>{o.label}<span>↗</span></button>)}</div>
            </div> : <div className="scenario-options" role="group" aria-labelledby="question-heading" aria-describedby="question-context">{q.options.map(o=>{
              const index=selected.indexOf(o.key);
              return <button type="button" key={o.key} aria-pressed={index>=0} className={index>=0?"selected":""} onClick={()=>toggle(o.key)}><span className="option-letter">{o.key}</span><span>{o.label}</span><span className="option-selection">{index===0?"1st":index===1?"2nd":""}</span></button>;
            })}<p className="scenario-help">Pick your first move. A second choice is optional.</p></div>}
          </motion.div>
        </AnimatePresence>
        {error && <p role="alert" className="onboarding-error">{error}</p>}
        <div className="onboarding-actions"><button type="button" className="onboarding-back" disabled={step===0} onClick={()=>{setError(null);setStep(step-1);}}>← Back</button><button type="submit" className="onboarding-next" disabled={!canContinue}>{step===4?"Find my starting point":"Continue"} <span>→</span></button></div>
        <p className="onboarding-purpose">These choices help shape your first quests. Your profile keeps adapting as you go.</p>
      </form>
    </section>
  </main>;
}
