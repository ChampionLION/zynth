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

export default function QuestPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { activeQuest, setActiveQuest, setProfile, applyPipelineResult } = useZynth();

  const [response, setResponse] = useState("");
  const [stepResponses, setStepResponses] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [backConfirm, setBackConfirm] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const [rejected, setRejected] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(
      () => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  if (!hydrated || !profile) return null;
  if (!activeQuest) {
    router.replace("/dashboard");
    return null;
  }

  const isMultiStep = activeQuest.steps.length > 0;
  const step = isMultiStep ? activeQuest.steps[currentStep] : null;
  const isLastStep = !isMultiStep || currentStep === activeQuest.steps.length - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const nextStep = () => {
    if (!response.trim()) return;
    setStepResponses([...stepResponses, response]);
    setResponse("");
    setCurrentStep(currentStep + 1);
  };

  const submit = async () => {
    if (!response.trim() || submissionLock.current) return;
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
    const p = structuredClone(profile);
    if (!spendToken(p)) {
      setSkipConfirm(false);
      return;
    }
    p.last_quest_date = todayStr(); // skip preserves the day
    p.last_active = new Date().toISOString();
    await setProfile(p);
    await setActiveQuest(null);
    router.replace("/dashboard");
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
      className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-6 pt-4"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <button
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
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your response here..."
        className="mt-4 min-h-[200px] flex-1 resize-none rounded-xl border border-edge bg-surface p-4 text-sm leading-relaxed text-primary placeholder:text-dim"
      />

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
          disabled={profile.tokens < 1}
          className="rounded-lg border border-edge px-4 py-3 text-sm text-muted disabled:opacity-30"
        >
          Skip ◈{profile.tokens}
        </button>
        {isLastStep ? (
          <button
            onClick={submit}
            disabled={!response.trim()}
            className="flex-1 rounded-lg bg-amber py-3 font-semibold text-black transition-opacity disabled:opacity-30"
          >
            {isMultiStep ? "Complete Mission →" : "Submit →"}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!response.trim()}
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
            body="Your response won't be saved."
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-8"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-edge bg-surface p-6"
      >
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-5 flex gap-3">
          <button
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
      </motion.div>
    </motion.div>
  );
}
