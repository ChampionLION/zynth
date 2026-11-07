"use client";

// QUEST SCREEN — full screen takeover. Timer, hint drawer, skip,
// multi-step missions, submit → exploit check → grade → pipeline.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion,useReducedMotion } from "framer-motion";
import { useZynth } from "@/lib/store";
import { useRequireProfile } from "@/components/useRequireProfile";
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
import {JourneyRequestError} from "@/lib/journey-client";
import {QuestLearning} from "@/components/QuestLearning";
import {learningChoiceResponse,selectedLearningOption} from "@/lib/learning";
import {Button} from "@/components/ui/Atlas";
import {BottomNav} from "@/components/BottomNav";
import {caseBlocks,answerChecks} from "@/lib/journey-presentation";
import {cachedInventory} from "@/lib/inventory-client";
import {useAppearance} from "@/components/AppearanceProvider";


export default function QuestPage() {
  const router = useRouter();
  const reducedMotion=useReducedMotion(),{appearance}=useAppearance();
  const quietMotion=reducedMotion||appearance.motion==="reduced";
  const { profile, hydrated } = useRequireProfile();
  const { user, activeQuest, retireActiveQuest, setProfile, applyPipelineResult,mode,journeyAction,completeQuest } = useZynth();

  const [focusMode,setFocusMode]=useState(false),[caseOpen,setCaseOpen]=useState(false),[reviewStep,setReviewStep]=useState<number|null>(null),[reviewedCriteria,setReviewedCriteria]=useState(false);
  const caseRef=useRef<HTMLDetailsElement>(null);
  const [smallScreen,setSmallScreen]=useState(false);
  useEffect(()=>{const media=matchMedia("(max-width:700px)"),sync=()=>setSmallScreen(media.matches);sync();media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync);},[]);
  useEffect(()=>{document.body.dataset.focusMode=String(focusMode);return()=>{delete document.body.dataset.focusMode;};},[focusMode]);
  useEffect(()=>{if(new URLSearchParams(location.search).get('skip')==='1')setSkipConfirm(true);},[]);
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
  const [syncStatus,setSyncStatus]=useState("Saving draft…");

  useEffect(()=>{
    if(!activeQuest){if(hydrated&&profile)router.replace("/dashboard");return;}
    const revision=`${activeQuest.id}:${activeQuest.learning?"lesson-v1":"legacy"}`;
    if(restoredRef.current===revision)return;
    const draft=activeQuest.draft;
    setResponse(draft?.response??"");setStepResponses(activeQuest.steps.length?draft?.step_responses??[]:[]);
    setCurrentStep(activeQuest.steps.length?draft?.current_step??0:0);setSeconds(draft?.elapsed_seconds??0);
    startRef.current=Date.now()-(draft?.elapsed_seconds??0)*1000;
    setRestoredId(activeQuest.id);
    restoredRef.current=revision;
  },[activeQuest,hydrated,profile,router]);

  useEffect(()=>{
    if(!user||!activeQuest||restoredId!==activeQuest.id||evaluating)return;
    const draft={response,step_responses:stepResponses,current_step:currentStep,elapsed_seconds:Math.floor((Date.now()-startRef.current)/1000),updated_at:new Date().toISOString()};
    cacheQuestDraft(user.id,activeQuest.id,draft);
    let disposed=false;
    setSyncStatus("Saving draft…");
    const timer=setTimeout(()=>{void saveQuestDraft(user.id,activeQuest.id,draft).then(()=>{if(!disposed)setSyncStatus("Saved ✓");}).catch(()=>{if(!disposed)setSyncStatus("Saved on this device ✓");});},600);
    const flush=()=>{cacheQuestDraft(user.id,activeQuest.id,draft);void saveQuestDraft(user.id,activeQuest.id,draft).catch(()=>{});};
    window.addEventListener("zynth-focus-ending",flush);
    return()=>{disposed=true;clearTimeout(timer);window.removeEventListener("zynth-focus-ending",flush);};
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

  const blocks=caseBlocks(activeQuest.scenario??activeQuest.description),checks=answerChecks(response,activeQuest.scenario??activeQuest.description,step?.success_criteria??activeQuest.success_criteria);
  const caseReading=<div className="case-reading">
     {activeQuest.learning?<QuestLearning part="lessons" quest={activeQuest} response={response} disabled={voiceBusy} onSelect={()=>{}}/>:<><p className="eyebrow">THE PROBLEM</p><h2>A case to work with.</h2><p>{blocks.problem}</p>{blocks.evidence.length>0&&<section><h3>Evidence & constraints</h3><ul>{blocks.evidence.map((line,i)=><li key={i}>{line.replace(/^[-•]\s*/,'')}</li>)}</ul></section>}<details className="reference-accordion"><summary>▤ Reference for this case</summary><p>{blocks.reference||activeQuest.description}</p>{!!activeQuest.assessment_topics?.length&&<p>{activeQuest.assessment_topics.join(' · ')}</p>}</details></>}
    </div>;
  const nextStep = () => {
    setReviewedCriteria(false);setReviewStep(null);
    if (!response.trim()||voiceBusy) return;
    setStepResponses([...stepResponses, response]);
    setResponse("");
    setCurrentStep(currentStep + 1);
  };

  const submit = async () => {
    if (!response.trim() || submissionLock.current || voiceBusy) return;
    if(activeQuest.learning&&!selectedLearningOption(activeQuest,response)){setSubmitError("Choose an option, or start your reply with Option A, Option B or Option C.");return;}
    submissionLock.current = true;
    try{const inventory=cachedInventory(profile.user_id),key=`zynth:inventory-before:${profile.user_id}:${activeQuest.id}`;if(inventory&&!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(inventory.items.filter(i=>i.owned).map(i=>i.id)));}catch{/* Cosmetic presentation never blocks learning. */}
    setSubmitError(null);
    setEvaluating(true);
    try {
    const responseTimeSeconds = Math.floor((Date.now() - startRef.current) / 1000);
    const fullResponse = isMultiStep
      ? [...stepResponses, response]
          .map((r, i) => `[Step ${i + 1}: ${activeQuest.steps[i]?.title ?? ""}]\n${r}`)
          .join("\n\n")
      : response;

    if(mode==="trusted"){

      await completeQuest(activeQuest.id,fullResponse);
      router.replace("/grade");return;
    }

    // Engine 7 — anti-exploit
    const exploit = runExploitCheck({
      profile,
      quest:activeQuest,
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
    } catch(error) { setSubmitError(error instanceof Error&&error.message==="Reply saved."?error.message:error instanceof JourneyRequestError&&[413,422,429].includes(error.status)?error.message:"Your response is still here. We couldn’t save the result. Please try again."); } finally { submissionLock.current = false; setEvaluating(false); }
  };

  const skip = async () => {
    if(submissionLock.current||voiceBusy)return;submissionLock.current=true;setSubmitError(null);
    try{
    if(mode==="trusted"){await journeyAction({kind:"skip",questId:activeQuest.id});router.replace("/dashboard");return;}
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
          transition={{ repeat: Infinity, duration: 0.2 }}
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
   <motion.main initial={quietMotion?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} className={`app-page quest-workbench ${focusMode?'focus-mode':''}`}>
    <header className="quest-topline"><button className="quiet-link" disabled={voiceBusy} onClick={()=>response.trim()||stepResponses.length?setBackConfirm(true):router.back()}>← Your journey</button><span className="calm-timer">◷ {mm}:{ss} elapsed · {activeQuest.estimated_time}</span><Button variant="ghost" aria-pressed={focusMode} onClick={()=>setFocusMode(v=>!v)}>{focusMode?'Exit focus':'Focus mode'} ⛶</Button></header>
    <div className="quest-title"><p className="eyebrow">{activeQuest.learning?'LEARN & PRACTISE':'YOUR MISSION'}</p><h1>{activeQuest.quest_title}</h1></div>
    {isMultiStep&&<nav className="mission-stepper" aria-label="Mission steps">{activeQuest.steps.map((s,i)=><button key={s.step_number} aria-current={i===currentStep?'step':undefined} disabled={i>currentStep||voiceBusy} data-disabled-reason={i>currentStep?'Finish the previous step':'Recording…'} aria-label={`${i<currentStep?'Review completed step':i===currentStep?'Current step':'Locked step'} ${i+1}: ${s.title}`} onClick={()=>setReviewStep(i<currentStep?i:null)}><b>{i<currentStep?'✓':i+1}</b><span>{['Understand','Solve','Check'][i]??s.title}</span></button>)}</nav>}
    <div className="quest-columns"><details className="case-sheet" hidden={smallScreen} open={caseOpen} onToggle={e=>setCaseOpen(e.currentTarget.open)} ref={caseRef}><summary>▤ {activeQuest.learning?'Read the lessons':'Read the case'}</summary>{caseReading}</details><section className="answer-workspace" aria-label="Your answer workspace"><button className="mobile-case-toggle quiet-link" onClick={()=>{setCaseOpen(true);if(!smallScreen)setTimeout(()=>caseRef.current?.scrollIntoView({behavior:quietMotion?'auto':'smooth',block:'start'}),0);}}>▤ {activeQuest.learning?'Read the lessons':'Read the case'}</button>
     {reviewStep!==null?<section className="step-review"><p className="eyebrow">✓ COMPLETED STEP {reviewStep+1}</p><h2>{activeQuest.steps[reviewStep].title}</h2><p>{activeQuest.steps[reviewStep].prompt}</p><blockquote>{stepResponses[reviewStep]}</blockquote><Button onClick={()=>setReviewStep(null)}>Return to current step →</Button></section>:<>
     <p className="eyebrow">{isMultiStep?`STEP ${currentStep+1}`:'YOUR NEXT STEP'}</p><h2>{step?.title??(activeQuest.learning?'Try what you learned.':'Make it your own.')}</h2>{step&&<p className="step-prompt">{step.prompt}</p>}
     <QuestLearning part="check" quest={activeQuest} response={response} disabled={voiceBusy} onSelect={key=>{setResponse(learningChoiceResponse(activeQuest,response,key));setSubmitError(null);}}/>
     <div className="answer-editor"><div className="answer-toolbar"><label htmlFor="quest-response">{activeQuest.learning?'Your reasoning (optional)':'Your answer'}</label><span role="status">{syncStatus.startsWith('Saving')?'Saving…':'Saved ✓'}</span></div>
      <textarea id="quest-response" disabled={voiceBusy} maxLength={24000} value={response} onChange={e=>setResponse(e.target.value)} placeholder={activeQuest.learning?'Choose an option, then add a thought if you like…':'Work with the supplied case. Explain your solution and why it fits…'}/>
      <div className="answer-bottom-toolbar"><VoiceReply compact key={`${user?.id}:${activeQuest.id}:${currentStep}`} value={response} onChange={setResponse} onBusyChange={setVoiceBusy}/><small>{checks.words} words</small></div>
     </div>
     <aside className="answer-checklist" aria-label="Before you complete"><p className="eyebrow">BEFORE YOU COMPLETE</p>{activeQuest.learning?<p>{selectedLearningOption(activeQuest,response)?'✓ Answer selected':'○ Choose a solution above'}</p>:<>{checks.checks.map((check,i)=>'manual'in check?<label key={i}><input type="checkbox" checked={reviewedCriteria} onChange={e=>setReviewedCriteria(e.target.checked)}/><span>I’ve checked: {check.label}</span></label>:<p key={i} className={check.done?'check-done':''}><span aria-hidden="true">{check.done?'✓':'○'}</span> {check.label}</p>)}<small>The checklist helps you review; your solution is evaluated when you complete.</small></>}</aside>
     </>}
     {submitError&&<p role="alert">{submitError}</p>}
    </section></div>
    {smallScreen&&caseOpen&&<Dialog title={activeQuest.learning?"Read the lessons":"Read the case"} className="mobile-reading-sheet" onClose={()=>setCaseOpen(false)}><button className="panel-close" aria-label="Close reading sheet" onClick={()=>setCaseOpen(false)}>×</button>{caseReading}</Dialog>}
    <footer className="quest-actionbar"><Button onClick={()=>setHintOpen(true)}>Hint ◎</Button><Button variant="ghost" disabled={profile.tokens<1||voiceBusy} disabledReason={profile.tokens<1?'No Skip Tokens':'Recording…'} onClick={()=>setSkipConfirm(true)}>Skip · {profile.tokens} tokens</Button><div><Button variant="primary" disabled={reviewStep!==null||!response.trim()||voiceBusy||!!activeQuest.learning&&!selectedLearningOption(activeQuest,response)} disabledReason={reviewStep!==null?'Return to the current step':voiceBusy?'Finish recording first':activeQuest.learning?'Choose an option above':'Write your answer to continue'} onClick={()=>isLastStep?void submit():nextStep()}>{activeQuest.learning?'Check understanding':isLastStep?'Complete mission':'Next step'} →</Button></div></footer><BottomNav/>

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
              <p className="text-xs tracking-widest text-dim">HINT</p>
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
            body={syncStatus==="Saved ✓"?"Your draft is saved. Come back when you’re ready.":"Your latest draft stays on this browser. Wait for it to sync to continue on another device."}
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
