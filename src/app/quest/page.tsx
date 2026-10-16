"use client";

// QUEST SCREEN — full screen takeover. Timer, hint drawer, skip,
// multi-step missions, submit → exploit check → grade → pipeline.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { useRequireProfile } from "@/components/useRequireProfile";
import { DifficultyPips } from "@/components/effects";
import { display } from "@/lib/ui";
import { runExploitCheck, recordExploitFlag } from "@/lib/engines/exploit";
import { gradeResponse } from "@/lib/llm/client";
import { runPostGradePipeline } from "@/lib/engines/pipeline";
import { spendToken } from "@/lib/engines/economy";
import { todayStr } from "@/lib/engines/quest";
import {cacheQuestDraft,saveQuestDraft} from "@/lib/db";
import {missionProgress} from "@/lib/engines/quest-cycle";
import {writeMilestone} from "@/lib/engines/memory";
import {VoiceReply} from "@/components/VoiceReply";
import {Dialog} from "@/components/Dialog";

export default function QuestPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { user, activeQuest, retireActiveQuest, setProfile, applyPipelineResult } = useZynth();

  const [response, setResponse] = useState("");
  const [stepResponses, setStepResponses] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [backConfirm, setBackConfirm] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [voiceBusy,setVoiceBusy]=useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const [rejected, setRejected] = useState(false);
  const startRef = useRef(Date.now());
  const [restoredId,setRestoredId]=useState<string|null>(null);
  const restoredRef=useRef<string|null>(null);
  const [syncStatus,setSyncStatus]=useState("Your draft saves as you go.");

  useEffect(()=>{
    if(!activeQuest){if(hydrated&&profile)router.replace("/dashboard");return;}
    if(restoredRef.current===activeQuest.id)return;
    const draft=activeQuest.draft;
    setResponse(draft?.response??"");setStepResponses(draft?.step_responses??[]);
    setCurrentStep(draft?.current_step??0);setSeconds(draft?.elapsed_seconds??0);
    startRef.current=Date.now()-(draft?.elapsed_seconds??0)*1000;
    setRestoredId(activeQuest.id);
    restoredRef.current=activeQuest.id;
  },[activeQuest,hydrated,profile,router]);

  useEffect(()=>{
    if(!user||!activeQuest||restoredId!==activeQuest.id||evaluating)return;
    const draft={response,step_responses:stepResponses,current_step:currentStep,elapsed_seconds:Math.floor((Date.now()-startRef.current)/1000),updated_at:new Date().toISOString()};
    cacheQuestDraft(user.id,activeQuest.id,draft);
    let disposed=false;
    setSyncStatus("Saving draft…");
    const timer=setTimeout(()=>{void saveQuestDraft(user.id,activeQuest.id,draft).then(()=>{if(!disposed)setSyncStatus("Draft saved to your account.");}).catch(()=>{if(!disposed)setSyncStatus("Saved on this browser. Reconnect to sync your draft.");});},600);
    return()=>{disposed=true;clearTimeout(timer);};
  },[user,activeQuest,restoredId,response,stepResponses,currentStep,evaluating]);

  useEffect(() => {
    const t = setInterval(
      () => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  if (!hydrated || !profile) return null;
  if (!activeQuest || restoredId!==activeQuest.id) return null;

  const isMultiStep = activeQuest.steps.length > 0;
  const step = isMultiStep ? activeQuest.steps[currentStep] : null;
  const isLastStep = !isMultiStep || currentStep === activeQuest.steps.length - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const nextStep = () => {
    if (!response.trim()||voiceBusy) return;
    setStepResponses([...stepResponses, response]);
    setResponse("");
    setCurrentStep(currentStep + 1);
  };

  const submit = async () => {
    if (!response.trim() || submissionLock.current || voiceBusy) return;
    submissionLock.current = true;
    setSubmitError(null);
    setEvaluating(true);
    try {
    const responseTimeSeconds = Math.floor((Date.now() - startRef.current) / 1000);
    const fullResponse = isMultiStep
      ? [...stepResponses, response]
          .map((r, i) => `[Step ${i + 1}: ${activeQuest.steps[i]?.title ?? ""}]\n${r}`)
          .join("\n\n")
      : response;

    // Engine 7 — anti-exploit
    const exploit = runExploitCheck({
      profile,
      response: fullResponse,
      responseTimeSeconds,
    });
    const p = structuredClone(profile);
    recordExploitFlag(p, exploit);

    if (exploit.rejected) {
      await setProfile(p);
      setEvaluating(false);
      setRejected(true);
      return;
    }

    // Engine 3 — grade (LLM signals only)
    const gradeResult = await gradeResponse({
      quest: activeQuest,
      response: fullResponse,
      profile: p,
      responseTimeSeconds,
      strict: exploit.strictGrader,
    });

    // 14-step pipeline — app owns all math
    const result = await runPostGradePipeline({
      profile: p,
      quest: activeQuest,
      gradeResult,
      responseText: fullResponse,
      responseTimeSeconds,
      exploit,
      swiftModeUsed: false,
    });

    await applyPipelineResult(result, {
      gradeResult,
      expEarned: result.expEarned,
      streakMultiplier: result.streakMultiplier,
      changedStats: result.changedStats,
    });
    router.replace("/grade");
    } catch { setSubmitError("Your response is still here. We couldn’t save the result. Please try again."); } finally { submissionLock.current = false; setEvaluating(false); }
  };

  const skip = async () => {
    if(submissionLock.current||voiceBusy)return;submissionLock.current=true;setSubmitError(null);
    try{
    const p = structuredClone(profile);
    const recorded=p.memory.milestones.some(m=>m.type==="quest_skipped"&&m.quest_id===activeQuest.id);
    if (!recorded && !spendToken(p)) {
      setSkipConfirm(false);
      return;
    }
    p.last_quest_date = todayStr(); // skip preserves the day
    p.last_active = new Date().toISOString();
    if(!recorded)writeMilestone(p,"quest_skipped",{quest_id:activeQuest.id});
    if(activeQuest.type==="mission"&&!p.memory.milestones.some(m=>m.type==="mission_skipped"&&m.quest_id===activeQuest.id))writeMilestone(p,"mission_skipped",{quest_id:activeQuest.id,cycle:missionProgress(p).cycle});
    await setProfile(p);
    await retireActiveQuest("skipped",p.user_id);
    router.replace("/dashboard");
    }catch{setSubmitError("We couldn’t finish skipping this challenge. Please reopen your journey before trying again.");setSkipConfirm(false);}finally{submissionLock.current=false;}
  };

  if (evaluating) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-14 w-14 rounded-full border-2 border-edge border-t-amber"
          style={{ animation: "spin 1.2s linear infinite" }}
        />
        <p className="mt-6 animate-pulse text-sm tracking-[0.3em] text-amber">
          EVALUATING...
        </p>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 pb-6 pt-6"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <button
          disabled={voiceBusy}
          aria-label="Back to your journey"
          onClick={() =>
            response.trim() || stepResponses.length
              ? setBackConfirm(true)
              : router.back()
          }
          className="text-xl text-muted"
        >
          ←
        </button>
        <span className="font-mono text-sm text-dim">
          {mm}:{ss}
        </span>
      </div>

      {/* HEADER */}
      <div className="mt-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-edge px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
            {activeQuest.type}
          </span>
          <DifficultyPips difficulty={activeQuest.difficulty} />
        </div>
        <div className="mt-3 border-l-2 border-amber pl-3">
          <p className="text-sm italic text-amber/90">{activeQuest.flavor_text}</p>
        </div>
        <h1 className="mt-3 text-2xl font-bold">{activeQuest.quest_title}</h1>

        {isMultiStep ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted">
                Step {currentStep + 1} of {activeQuest.steps.length}
              </span>
              <span className="flex gap-1">
                {activeQuest.steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i <= currentStep ? "bg-amber" : "bg-edge"
                    }`}
                  />
                ))}
              </span>
            </div>
            {/* previous steps collapsed */}
            {stepResponses.map((r, i) => (
              <details
                key={i}
                className="mt-2 rounded-lg border-l-2 border-amber bg-surface px-3 py-2"
              >
                <summary className="cursor-pointer text-xs text-muted">
                  ✓ Step {i + 1}: {activeQuest.steps[i].title}
                </summary>
                <p className="mt-1 whitespace-pre-wrap text-xs text-dim">{r}</p>
              </details>
            ))}
            {step && (
              <>
                <h2 className="mt-4 font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm text-muted">{step.prompt}</p>
              </>
            )}
          </>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
            {activeQuest.description}
          </p>
        )}

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
        <div className="mt-3 rounded-lg bg-bg p-3 text-xs text-muted">
          <span className="text-dim">Success criteria — </span>
          {step ? step.success_criteria : activeQuest.success_criteria}
        </div>
      </div>

      {/* INPUT */}
      <VoiceReply key={`${user?.id}:${activeQuest.id}:${currentStep}`} value={response} onChange={setResponse} onBusyChange={setVoiceBusy}/>
      <label htmlFor="quest-response" className="mt-5 text-xs font-medium text-muted">Your reply / editable transcript</label>
      <textarea
        id="quest-response"
        disabled={voiceBusy}
        maxLength={24000}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your answer, or record it above and review the transcript here…"
        className="mt-2 min-h-[200px] flex-1 resize-none rounded-xl border border-edge bg-surface p-4 text-sm leading-relaxed text-primary placeholder:text-dim disabled:opacity-70"
      />
      <p className="mt-2 text-xs text-muted" role="status">{syncStatus}</p>

      {submitError && <p role="alert" className="mt-3 text-sm text-amber">{submitError}</p>}
      {/* ACTION ROW */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setHintOpen(true)}
          className="rounded-lg border border-edge px-4 py-3 text-sm text-muted"
        >
          Hint ◎
        </button>
        <button
          onClick={() => setSkipConfirm(true)}
          disabled={profile.tokens < 1||voiceBusy}
          className="rounded-lg border border-edge px-4 py-3 text-sm text-muted disabled:opacity-30"
        >
          Skip ◈{profile.tokens}
        </button>
        {isLastStep ? (
          <button
            onClick={submit}
            disabled={!response.trim()||voiceBusy}
            className="flex-1 rounded-lg bg-amber py-3 font-semibold text-black transition-opacity disabled:opacity-30"
          >
            {isMultiStep ? "Complete Mission →" : "Submit →"}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!response.trim()||voiceBusy}
            className="flex-1 rounded-lg bg-amber py-3 font-semibold text-black transition-opacity disabled:opacity-30"
          >
            Next Step →
          </button>
        )}
      </div>

      {/* HINT DRAWER */}
      <AnimatePresence>
        {hintOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/50"
            onClick={() => setHintOpen(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="w-full rounded-t-2xl border-t border-edge bg-surface p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] tracking-widest text-dim">HINT</p>
              <p className="mt-2 text-sm text-primary">{activeQuest.hint}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SKIP CONFIRM */}
      <AnimatePresence>
        {skipConfirm && (
          <ConfirmModal
            title="Skip today's quest?"
            body={`This costs 1 skip token (you have ${profile.tokens}). Your streak survives.`}
            confirmLabel="Skip ◈1"
            onConfirm={skip}
            onCancel={() => setSkipConfirm(false)}
          />
        )}
        {backConfirm && (
          <ConfirmModal
            title="Leave the quest?"
            body={syncStatus.includes("account")?"Your draft is saved. Come back when you’re ready.":"Your latest draft stays on this browser. Wait for it to sync to continue on another device."}
            confirmLabel="Leave"
            onConfirm={() => router.back()}
            onCancel={() => setBackConfirm(false)}
          />
        )}
        {rejected && (
          <ConfirmModal
            title="Something's off"
            body="That submission didn't go through. Take a breath and try again with a fresh angle."
            confirmLabel="Try again"
            onConfirm={() => setRejected(false)}
            onCancel={() => setRejected(false)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function ConfirmModal({
  title, body, confirmLabel, onConfirm, onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog title={title} onClose={onCancel}>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-5 flex gap-3">
          <button
            autoFocus
            onClick={onCancel}
            className="flex-1 rounded-lg border border-edge py-2.5 text-sm text-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-amber py-2.5 text-sm font-semibold text-black"
          >
            {confirmLabel}
          </button>
        </div>
    </Dialog>
  );
}
