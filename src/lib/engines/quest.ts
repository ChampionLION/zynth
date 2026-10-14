// ─── Engine 2: Quest type resolver + difficulty ──────────────────

import type { AdaptiveState, Profile, QuestType } from "../types";

export function daysSince(iso: string | null): number {
  if (!iso) return 999;
  const then = new Date(iso).getTime();
  return Math.floor((Date.now() - then) / 86400_000);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resolveQuestType(profile: Profile): QuestType {
  const { quest_history, streak, level } = profile;

  // First quest ever → calibration
  if (!quest_history || quest_history.length === 0) return "calibration";

  // Three consecutive Fails → weakness quest
  const lastThree = quest_history.slice(-3);
  if (lastThree.length === 3 && lastThree.every((q) => q.grade === "Fail")) {
    return "weakness";
  }

  // Weekly mission — streak multiple of 7
  if (streak > 0 && streak % 7 === 0) {
    const lastMission = [...quest_history]
      .reverse()
      .find((q) => q.quest_type === "mission");
    if (!lastMission || daysSince(lastMission.completed_at) >= 7) {
      return "mission";
    }
  }

  // Challenge — level 10+, 20% chance
  if (level >= 10 && Math.random() < 0.2) return "challenge";

  // Hidden — 15% chance after last Excellent
  const lastQuest = quest_history[quest_history.length - 1];
  if (lastQuest?.grade === "Excellent" && Math.random() < 0.15) return "hidden";

  // Prestige — level 100+, 10% chance
  if (level >= 100 && Math.random() < 0.1) return "prestige";

  return "daily";
}

export function calculateDifficulty(level: number): number {
  return Math.min(5, Math.max(1, Math.ceil(level / 5)));
}

const STATE_DIFFICULTY_MOD: Record<AdaptiveState, number> = {
  optimal: 0,
  bored: 2,
  burned_out: -1,
  stagnant: 0,
  struggling: -2,
  returning: -1,
  peaking: 1,
};

const STATE_QUEST_OVERRIDE: Partial<Record<AdaptiveState, QuestType[]>> = {
  bored: ["challenge", "hidden"],
  burned_out: ["daily"],
  struggling: ["weakness"],
  returning: ["daily"],
  peaking: ["challenge", "mission"],
};

export function resolveQuestPlan(profile: Profile): {
  questType: QuestType;
  difficulty: number;
} {
  let questType = resolveQuestType(profile);
  const state = profile.current_adaptive_state;

  // calibration and weakness (3 fails) are non-negotiable; otherwise
  // adaptive state can steer the type
  if (questType !== "calibration" && questType !== "weakness" && questType !== "mission") {
    const prefs = STATE_QUEST_OVERRIDE[state];
    if (prefs && !prefs.includes(questType)) {
      // steer daily → preferred type respecting gates
      if (state === "bored" && profile.level >= 10) questType = "challenge";
      else if (state === "struggling") questType = "weakness";
      else if (state === "peaking" && profile.level >= 10 && Math.random() < 0.5)
        questType = "challenge";
      else if (state === "burned_out" || state === "returning") questType = "daily";
    }
  }

  const base = calculateDifficulty(profile.level);
  const difficulty = Math.min(5, Math.max(1, base + (STATE_DIFFICULTY_MOD[state] ?? 0)));
  return { questType, difficulty };
}
