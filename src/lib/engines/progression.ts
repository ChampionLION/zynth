// ─── Engine 5: Progression ───────────────────────────────────────

import type { Profile } from "../types";
import { awardXPCards } from "./economy";

export const GRADE_BASE_EXP: Record<string, number> = {
  Excellent: 15,
  Good: 9,
  Basic: 6,
  Bad: 3,
  Fail: 0,
};

export function calculateStreakMultiplier(streak: number): number {
  if (streak >= 100) return 3.0;
  if (streak >= 60) return 2.5;
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7) return 1.5;
  return 1.0;
}

const QUEST_TYPE_MULTIPLIER: Record<string, number> = {
  calibration: 1,
  daily: 1,
  mission: 3,
  challenge: 5,
  hidden: 2,
  weakness: 1,
  prestige: 8,
};

export function calculateFinalEXP(
  grade: string,
  streak: number,
  prestigeBonus = 1.0,
  questType = "daily",
  exploitPenalty = 1.0
): number {
  const base = GRADE_BASE_EXP[grade] || 0;
  const typeMult = QUEST_TYPE_MULTIPLIER[questType] ?? 1;
  return Math.round(
    base * typeMult * calculateStreakMultiplier(streak) * prestigeBonus * exploitPenalty
  );
}

export function calculateExpToNext(level: number): number {
  return Math.round(30 * level * (1 + Math.log(level + 1)));
}

export function getTitleForLevel(level: number): string {
  if (level >= 1000) return "Zenith"; // LLM-generated in live mode
  if (level >= 500) return "Mythic";
  if (level >= 300) return "Legendary";
  if (level >= 200) return "Grandmaster";
  if (level >= 150) return "Master";
  if (level >= 100) return "Expert";
  if (level >= 75) return "Specialist";
  if (level >= 50) return "Artisan";
  if (level >= 35) return "Craftsman";
  if (level >= 20) return "Forgehand";
  if (level >= 10) return "Journeyman";
  if (level >= 5) return "Apprentice";
  return "Initiate";
}

export interface LevelUpResult {
  didLevelUp: boolean;
  newLevel: number;
  newExp: number;
  newExpToNext: number;
  newTitle: string | null;
}

export function checkLevelUp(
  currentLevel: number,
  currentExp: number,
  addedExp: number
): LevelUpResult {
  let level = currentLevel;
  let exp = currentExp + addedExp;
  let didLevelUp = false;
  for (;;) {
    const required = calculateExpToNext(level);
    if (exp >= required) {
      exp -= required;
      level++;
      didLevelUp = true;
    } else break;
  }
  return {
    didLevelUp,
    newLevel: level,
    newExp: exp,
    newExpToNext: calculateExpToNext(level),
    newTitle: didLevelUp ? getTitleForLevel(level) : null,
  };
}

export const LEVEL_UNLOCKS: Record<number, string> = {
  5: "Swift Mode",
  10: "Challenge Quests",
  20: "Memory Context",
  100: "Prestige",
};

export function unlocksBetween(fromLevel: number, toLevel: number): string[] {
  const out: string[] = [];
  for (let l = fromLevel + 1; l <= toLevel; l++) {
    if (LEVEL_UNLOCKS[l]) out.push(LEVEL_UNLOCKS[l]);
  }
  return out;
}

// ── Skill EXP + tiers ────────────────────────────────────────────

export const EXP_SIGNALS: Record<string, number> = { high: 20, medium: 10, low: 5 };

export function calculateSkillExpToNext(skillLevel: number): number {
  return Math.round(3 * skillLevel * (1 + Math.log(skillLevel + 1)));
}

export function getSkillTier(level: number): { tier: number; name: string } {
  if (level >= 200) return { tier: 7, name: "Transcendent" };
  if (level >= 100) return { tier: 6, name: "Mastery" };
  if (level >= 50) return { tier: 5, name: "Expert" };
  if (level >= 25) return { tier: 4, name: "Advanced" };
  if (level >= 10) return { tier: 3, name: "Proficient" };
  if (level >= 4) return { tier: 2, name: "Developing" };
  return { tier: 1, name: "Raw" };
}

// ── Prestige ─────────────────────────────────────────────────────

export function applyPrestige(profile: Profile): Profile {
  if (profile.level < 100) throw new Error("Prestige requires level 100");
  const p = structuredClone(profile);
  const bump = (v: number) => v + 2 * p.prestige;
  p.prestige += 1;
  p.prestige_exp_bonus = 1.0 + p.prestige * 0.25;
  p.level = 1;
  p.exp = 0;
  p.exp_to_next = calculateExpToNext(1);
  p.title = "Initiate";
  p.stats = {
    focus: bump(p.onboarding_stats.focus),
    consistency: bump(p.onboarding_stats.consistency),
    adaptability: bump(p.onboarding_stats.adaptability),
    execution: bump(p.onboarding_stats.execution),
    stat_5: { ...p.onboarding_stats.stat_5, value: bump(p.onboarding_stats.stat_5.value) },
    stat_6: { ...p.onboarding_stats.stat_6, value: bump(p.onboarding_stats.stat_6.value) },
  };
  p.skills = p.skills.map((s) => ({ ...s, level: 1, exp: 0 }));
  awardXPCards(p,15,"prestige");
  p.memory.milestones.push({
    type: "prestige",
    prestige_number: p.prestige,
    date: new Date().toISOString(),
  });
  return p;
}

