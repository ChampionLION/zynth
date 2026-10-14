import type { Domain, LearningStyle, LLMProfileResult, OnboardingAnswers, Profile, WeaknessSignal } from "../types";
import { emptyMemory } from "./memory";
import { calculateExpToNext } from "./progression";

export type OnboardingSignals = {
  domains?: Partial<Record<Domain, number>>;
  styles?: Partial<Record<LearningStyle, number>>;
  weaknesses?: Partial<Record<WeaknessSignal, number>>;
  focus?: number;
  consistency?: number;
  adaptability?: number;
  execution?: number;
};
export interface OnboardingQuestion {
  id: keyof OnboardingAnswers;
  kind: "aspiration" | "scenario";
  chapter: string;
  prompt: string;
  context: string;
  options: { key: string; label: string; signals?: OnboardingSignals }[];
}

/** The question text, answer keys, and interpretation live together. */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "Q1", kind: "aspiration", chapter: "Choose your direction",
    prompt: "What do you want to become?",
    context: "A role, a craft, or something you want to get better at. Write it your way, or pick a starting point.",
    options: [
      { key: "Software Developer", label: "Software developer" },
      { key: "Designer", label: "Designer" },
      { key: "Data Analyst", label: "Data analyst" },
      { key: "Entrepreneur", label: "Entrepreneur" },
      { key: "Confident Communicator", label: "Confident communicator" },
      { key: "Still exploring", label: "Still exploring" },
    ],
  },
  {
    id: "Q2", kind: "scenario", chapter: "A queue that won't move",
    prompt: "A café has a long queue, but plenty of empty tables. The owner can try one change tomorrow. Which would you suggest?",
    context: "Each idea solves a different part of the problem. Choose the one you'd try first.",
    options: [
      { key: "A", label: "Track a few orders to find where the wait actually happens.", signals: { domains: { ANALYTICAL: 3 }, styles: { "Analytical Learner": 1 }, focus: 2 } },
      { key: "B", label: "Separate ordering from collection so the two queues stop blocking each other.", signals: { domains: { TECHNICAL: 3 }, styles: { "Practical Learner": 1 }, execution: 2 } },
      { key: "C", label: "Put a clearer menu outside so people can decide before they reach the counter.", signals: { domains: { CREATIVE: 3 }, focus: 1, execution: 1 } },
      { key: "D", label: "Have someone guide arrivals to the right place and answer quick questions.", signals: { domains: { SOCIAL: 3 }, adaptability: 1 } },
      { key: "E", label: "Offer a smaller menu at busy times, even if it means less choice.", signals: { domains: { STRATEGIC: 3 }, execution: 1, focus: 1 } },
    ],
  },
  {
    id: "Q3", kind: "scenario", chapter: "An unfamiliar tool",
    prompt: "You're making a simple event poster in a tool you haven't used. There's a sample, a short guide, and a blank canvas. Where do you start?",
    context: "The result can be simple. Pick the route that makes the tool easiest to work with.",
    options: [
      { key: "A", label: "Edit the sample and work out the controls as I go.", signals: { styles: { "Practical Learner": 3 }, execution: 2 } },
      { key: "B", label: "Follow the short guide once, then make my own version.", signals: { styles: { "Guided Learner": 3 }, consistency: 2 } },
      { key: "C", label: "Take the sample apart to see how its pieces fit together.", signals: { styles: { "Analytical Learner": 3 }, domains: { ANALYTICAL: 1, TECHNICAL: 1 }, focus: 2 } },
      { key: "D", label: "Try a few layouts on the blank canvas before settling on one.", signals: { styles: { "Exploratory Learner": 3 }, domains: { CREATIVE: 1 }, adaptability: 2 } },
    ],
  },
  {
    id: "Q4", kind: "scenario", chapter: "Something has to give",
    prompt: "A small pop-up event opens tomorrow, but two helpers can no longer come. What would you take off the team's plate first?",
    context: "The event still needs to work. Every cut protects something and gives something up.",
    options: [
      { key: "A", label: "Drop the extra activities and keep the main experience running well.", signals: { domains: { STRATEGIC: 2 }, execution: 2, focus: 1 } },
      { key: "B", label: "Use ready-made signs instead of finishing all the custom designs.", signals: { styles: { "Practical Learner": 1 }, adaptability: 2, execution: 1 } },
      { key: "C", label: "Remove the fixed schedule and let visitors move between stations freely.", signals: { styles: { "Exploratory Learner": 1 }, adaptability: 2, weaknesses: { scattered_interests: 1 } } },
      { key: "D", label: "Cut the extra promotion so the remaining helpers can focus on visitors.", signals: { domains: { SOCIAL: 2 }, focus: 1, consistency: 1 } },
      { key: "E", label: "Offer fewer time slots so the full setup still works for each group.", signals: { domains: { ANALYTICAL: 1, TECHNICAL: 1 }, consistency: 2, weaknesses: { overthinking: 1 } } },
    ],
  },
  {
    id: "Q5", kind: "scenario", chapter: "The last twenty minutes",
    prompt: "A one-page event guide is ready to send. The team has twenty minutes left. Where would you spend them?",
    context: "It already works. Choose what would make the biggest difference before it leaves the room.",
    options: [
      { key: "A", label: "Check the times, directions, and links one last time.", signals: { domains: { ANALYTICAL: 2 }, focus: 2, consistency: 1, weaknesses: { overthinking: 1 } } },
      { key: "B", label: "Tighten the wording and layout so the important details stand out.", signals: { domains: { CREATIVE: 2 }, focus: 2 } },
      { key: "C", label: "Let someone unfamiliar with the event read it and point out anything unclear.", signals: { domains: { SOCIAL: 2 }, adaptability: 2, weaknesses: { external_dependency: 1 } } },
      { key: "D", label: "Send it now and use the first questions to improve the next version.", signals: { domains: { TECHNICAL: 1 }, styles: { "Practical Learner": 1 }, execution: 2, adaptability: 1 } },
      { key: "E", label: "Turn the final checks into a short checklist for the next event.", signals: { domains: { STRATEGIC: 2 }, consistency: 2, execution: 1 } },
    ],
  },
];

export function normalizeAspiration(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/^(?:I (?:want|would like|hope) to (?:become|be)|to become)\s+/i, "").trim();
}

export function validateOnboardingAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  if (!Array.isArray(answers.Q1) || answers.Q1.length !== 1 || typeof answers.Q1[0] !== "string") throw new Error("Write one direction to get started.");
  const goal = normalizeAspiration(answers.Q1[0]);
  if (goal.length < 2 || goal.length > 120 || !/\p{L}/u.test(goal)) {
    throw new Error("Write a direction between 2 and 120 characters.");
  }
  const normalized = { ...answers, Q1: [goal] };
  for (const q of ONBOARDING_QUESTIONS.slice(1)) {
    const selected = answers[q.id];
    if (!Array.isArray(selected) || selected.length < 1 || selected.length > 2 || new Set(selected).size !== selected.length || selected.some(key => !q.options.some(o => o.key === key))) {
      throw new Error(`Choose an answer for ${q.chapter.toLowerCase()}.`);
    }
  }
  return normalized;
}

/** A stated direction chooses relevant content; scenarios describe how to approach it. */
export function aspirationDomain(goal: string): Domain | null {
  const text = normalizeAspiration(goal).toLowerCase();
  if (/\b(data|analyst|research|scientist|statistic|mathematic|economist)\w*/.test(text)) return "ANALYTICAL";
  if (/\b(developer|programmer|engineer|coding|software|robot|cyber|automation|architect)\w*/.test(text)) return "TECHNICAL";
  if (/\b(design|artist|writer|author|music|filmmak|photograph|animat|illustrat|creative|chef|content|storytell)\w*/.test(text)) return "CREATIVE";
  if (/\b(entrepreneur|founder|business|product manager|strateg|invest|executive|operations)\w*/.test(text)) return "STRATEGIC";
  if (/\b(communicat|teacher|educat|coach|mentor|leader|speaker|doctor|nurse|counsell|counsel|community)\w*/.test(text)) return "SOCIAL";
  return null;
}

export function buildProfile(userId: string, displayName: string, llmProfile: LLMProfileResult, aspiration?: string): Profile {
  const now = new Date().toISOString();
  const goal = aspiration ? normalizeAspiration(aspiration) : null;
  return {
    user_id: userId, display_name: displayName,
    aspiration: goal,
    profession: goal && goal.toLowerCase() !== "still exploring" ? goal : llmProfile.profession,
    domain: llmProfile.domain, domain_confidence: llmProfile.domain_confidence,
    learning_style: llmProfile.learning_style, behavior_signature: llmProfile.behavior_signature,
    weakness_signal: llmProfile.weakness_signal, title: "Initiate", schema_version: 2,
    level: 1, exp: 0, exp_to_next: calculateExpToNext(1), cumulative_exp: 0,
    prestige: 0, prestige_exp_bonus: 1, streak: 0, streak_best: 0,
    last_active: now, last_quest_date: null, tokens: 3, xp_cards: 0, xp_card_log: [],
    swift_mode_unlocked: false, current_adaptive_state: "optimal", adaptive_state_updated_at: now,
    energy_today: null, energy_date: null,
    stats: structuredClone(llmProfile.stats), onboarding_stats: structuredClone(llmProfile.stats),
    skills: llmProfile.skills.map(s => ({ name: s.name, level: 1, exp: 0, evolutions: [], timesTargeted: 0 })),
    hidden_skills: [], behavior_log: [], behavior_summary_cache: null, behavior_summary_quest_count: 0,
    unlocks: [], quest_history: [], exploit_flags: [], memory: emptyMemory(), continuous_profile_answers: [],
    achievements_unlocked: [], hidden_skill_counters: {}, exp_earned_today: 0, exp_today_date: null,
    leaderboard_opt_out: false, character_name: null, character_gender: null,
    created_at: now, updated_at: now,
  };
}
