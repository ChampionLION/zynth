// ─── Unified LLM client ──────────────────────────────────────────
// Mode "mock" (default): everything runs locally, deterministic.
// Mode "live": hits /api/llm (Gemini → Groq chain) with mock as the
// final fallback so the user always gets a quest (Engine 24 rule).

import { validateOnboardingAnswers } from "../engines/onboarding";
import {
  OnboardingResultSchema,
  QuestResultSchema,
  GradeResultSchema,
  DailyQuestionSchema,
} from "./schemas";
import {
  onboardingPrompt,
  questPrompt,
  gradingPrompt,
  dailyQuestionPrompt,
  hiddenSkillDiscoveryPrompt,
  skillEvolutionNamingPrompt,
  behaviorSummaryPrompt,
} from "./prompts";
import {
  mockClassifyOnboarding,
  mockGenerateQuest,
  mockGradeResponse,
  mockDailyQuestion,
  mockDiscoveryMessage,
  mockEvolveSkillName,
  mockBehaviorSummary,
} from "./mock";
import { buildCompressedContext } from "../engines/compression";
import type {
  GradeResult,
  LLMProfileResult,
  OnboardingAnswers,
  Profile,
  Quest,
  QuestType,
  DailyQuestion,
} from "../types";

export function isLiveMode(): boolean {
  return process.env.NEXT_PUBLIC_ZYNTH_MODE === "live";
}

async function callApi(prompt: string, purpose: string, expectJson = true): Promise<string> {
  const res = await fetch("/api/llm", {
    method: "POST",
    signal: AbortSignal.timeout(40000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, purpose, expectJson }),
  });
  if (!res.ok) throw new Error(`LLM API ${res.status}`);
  const data = await res.json();
  if (!data.text) throw new Error("empty LLM response");
  return data.text;
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Public API ───────────────────────────────────────────────────

export async function classifyOnboarding(
  answers: OnboardingAnswers
): Promise<LLMProfileResult> {
  answers = validateOnboardingAnswers(answers);
  if (isLiveMode()) {
    try {
      const raw = await callApi(
        onboardingPrompt(JSON.stringify(answers)),
        "onboarding"
      );
      return OnboardingResultSchema.parse(parseJson(raw)) as LLMProfileResult;
    } catch {
      // Retry once after 2s per blueprint, then fall back to mock
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const raw = await callApi(
          onboardingPrompt(JSON.stringify(answers)),
          "onboarding"
        );
        return OnboardingResultSchema.parse(parseJson(raw)) as LLMProfileResult;
      } catch {
        return mockClassifyOnboarding(answers);
      }
    }
  }
  // small artificial latency so the synthesis screen breathes
  await new Promise((r) => setTimeout(r, 1800));
  return mockClassifyOnboarding(answers);
}

export async function generateQuest(
  profile: Profile,
  questType: QuestType,
  difficulty: number,
  promptInjection: string
): Promise<Omit<Quest, "id" | "status" | "created_at" | "date">> {
  if (isLiveMode()) {
    try {
      const raw = await callApi(
        questPrompt({
          compressedProfile: JSON.stringify(
            buildCompressedContext(profile, "quest_generation")
          ),
          questType,
          difficulty,
          adaptiveState: profile.current_adaptive_state,
          promptInjection,
        }),
        "quest_generation"
      );
      const parsed = QuestResultSchema.parse(parseJson(raw));
      return {
        ...parsed,
        type: questType,
        difficulty,
        steps: questType === "mission" || questType === "prestige" ? parsed.steps : [],
      } as Omit<Quest, "id" | "status" | "created_at" | "date">;
    } catch {
      // Fallback quest library — user always gets a quest
      return mockGenerateQuest(profile, questType, difficulty);
    }
  }
  await new Promise((r) => setTimeout(r, 900));
  return mockGenerateQuest(profile, questType, difficulty);
}

export async function gradeResponse(args: {
  quest: Quest;
  response: string;
  profile: Profile;
  responseTimeSeconds: number;
  strict?: boolean;
}): Promise<GradeResult> {
  if (isLiveMode()) {
    try {
      const raw = await callApi(
        gradingPrompt({
          questJson: JSON.stringify({
            quest_title: args.quest.quest_title,
            description: args.quest.description,
            type: args.quest.type,
            success_criteria: args.quest.success_criteria,
            skills_targeted: args.quest.skills_targeted,
          }),
          userResponse: args.response.slice(0, 6000),
          compressedProfile: JSON.stringify(
            buildCompressedContext(args.profile, "grading")
          ),
          strictInjection: args.strict,
        }),
        "grading"
      );
      return GradeResultSchema.parse(parseJson(raw)) as GradeResult;
    } catch {
      throw new Error("Grading is temporarily unavailable. Your response can be retried.");
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  return mockGradeResponse(args);
}

export async function getDailyQuestion(profile: Profile): Promise<DailyQuestion | null> {
  const categories = [
    "time_environment", "mood_energy", "social_context", "risk_tolerance",
    "emotional_regulation", "ambition_signals", "identity_shifts",
  ];
  if (isLiveMode()) {
    try {
      const category =
        categories[profile.continuous_profile_answers.length % categories.length];
      const recent = profile.continuous_profile_answers
        .slice(-5)
        .map((a) => a.question);
      const raw = await callApi(
        dailyQuestionPrompt(category, recent),
        "daily_profile_question"
      );
      return DailyQuestionSchema.parse(parseJson(raw)) as DailyQuestion;
    } catch {
      return null; // blueprint: skip silently
    }
  }
  return mockDailyQuestion(profile);
}

export async function getDiscoveryMessage(
  skillName: string,
  profile: Profile
): Promise<string> {
  if (isLiveMode()) {
    try {
      return await callApi(
        hiddenSkillDiscoveryPrompt({
          profession: profile.profession,
          behaviorSignature: profile.behavior_signature,
          skillName,
        }),
        "hidden_skill_message",
        false
      );
    } catch {
      return "Something that was always in you has finally surfaced.";
    }
  }
  return mockDiscoveryMessage(skillName, profile.profession);
}

export async function getEvolvedSkillName(
  oldName: string,
  profile: Profile,
  tier: number
): Promise<string> {
  if (isLiveMode()) {
    try {
      const name = await callApi(
        skillEvolutionNamingPrompt({
          skillName: oldName,
          profession: profile.profession,
          tier,
        }),
        "skill_evolution_naming",
        false
      );
      return name.replace(/["\n]/g, "").trim().slice(0, 48) || mockEvolveSkillName(oldName, tier);
    } catch {
      return mockEvolveSkillName(oldName, tier); // keep-old-name would stall UX; deterministic evolve instead
    }
  }
  return mockEvolveSkillName(oldName, tier);
}

export async function getBehaviorSummary(profile: Profile): Promise<string> {
  if (isLiveMode()) {
    try {
      return await callApi(
        behaviorSummaryPrompt(
          JSON.stringify(profile.behavior_log.slice(-15))
        ),
        "behavior_summary",
        false
      );
    } catch {
      return profile.behavior_summary_cache ?? mockBehaviorSummary(profile);
    }
  }
  return mockBehaviorSummary(profile);
}
