// ─── Engine 4: Behavioral Stat Engine ────────────────────────────
// Stats are reflections, not rewards. Windows over the behavior log.

import type { BehaviorLogEntry, Profile, WeaknessSignal } from "../types";

export const WEAKNESS_MAP: Record<WeaknessSignal, keyof StatDeltas> = {
  poor_focus: "focus",
  inconsistency: "consistency",
  overthinking: "adaptability",
  fear_of_failure: "execution",
  laziness: "execution",
  scattered_interests: "adaptability",
  decision_paralysis: "adaptability",
  external_dependency: "consistency",
};

export interface StatDeltas {
  focus: number;
  consistency: number;
  adaptability: number;
  execution: number;
}

const GOOD_GRADES = ["Excellent", "Good"];
const WEAK_GRADES = ["Bad", "Fail"];

export function runStatEngine(
  log: BehaviorLogEntry[],
  weaknessSignal: WeaknessSignal,
  streakMilestoneHit: number | null
): StatDeltas {
  const short = log.slice(-5);
  const long = log.slice(-20);
  const deltas: StatDeltas = { focus: 0, consistency: 0, adaptability: 0, execution: 0 };
  const count = (arr: BehaviorLogEntry[], fn: (e: BehaviorLogEntry) => boolean) =>
    arr.filter(fn).length;

  // FOCUS (short window)
  if (count(short, (e) => e.response_depth === "thorough") >= 3) deltas.focus += 1;
  if (count(short, (e) => e.response_depth === "rushed") >= 3) deltas.focus -= 1;
  if (count(short, (e) => GOOD_GRADES.includes(e.grade)) >= 4) deltas.focus += 1;
  if (count(short, (e) => WEAK_GRADES.includes(e.grade)) >= 3) deltas.focus -= 1;

  // CONSISTENCY
  if (streakMilestoneHit) {
    deltas.consistency +=
      streakMilestoneHit >= 100 ? 5 : streakMilestoneHit >= 60 ? 4 : streakMilestoneHit >= 30 ? 3 : 2;
  }
  if (count(short, (e) => e.completedSameDay) >= 4) deltas.consistency += 1;
  const skips = count(short, (e) => !!e.skippedWithoutToken);
  if (skips >= 3) deltas.consistency -= 2;
  else if (skips >= 2) deltas.consistency -= 1;
  if (short.some((e) => e.returnedAfterBreak && !WEAK_GRADES.includes(e.grade)))
    deltas.consistency += 1;

  // ADAPTABILITY
  if (count(short, (e) => e.difficulty_handled === "exceeded") >= 2) deltas.adaptability += 1;
  if (count(short, (e) => e.difficulty_handled === "struggled") >= 3) deltas.adaptability -= 1;
  const typesInLong = new Set(long.map((e) => e.quest_type));
  const goodAcrossTypes =
    typesInLong.size >= 3 &&
    count(long, (e) => GOOD_GRADES.includes(e.grade)) >= typesInLong.size * 2;
  if (goodAcrossTypes) deltas.adaptability += 1;

  // EXECUTION
  if (short.length >= 5 && count(short, (e) => e.grade !== "Fail") >= 4) deltas.execution += 1;
  const lastThree = log.slice(-3);
  if (lastThree.length === 3 && lastThree.every((e) => e.grade === "Fail")) deltas.execution -= 1;
  if (count(short, (e) => e.completion_quality === "strong") >= 3) deltas.execution += 1;

  // Weakness modifier: breaking your pattern is harder than building a new one
  const weaknessStat = WEAKNESS_MAP[weaknessSignal];
  if (weaknessStat && deltas[weaknessStat] > 0) {
    deltas[weaknessStat] = Math.floor(deltas[weaknessStat] * 0.75);
  }

  return deltas;
}

/** Apply deltas with the onboarding floor rule. Returns changed stat names. */
export function applyStatDeltas(profile: Profile, deltas: StatDeltas): string[] {
  const changed: string[] = [];
  (Object.keys(deltas) as (keyof StatDeltas)[]).forEach((stat) => {
    if (deltas[stat] === 0) return;
    const floor = profile.onboarding_stats[stat];
    const next = Math.max(floor, profile.stats[stat] + deltas[stat]);
    if (next !== profile.stats[stat]) {
      profile.stats[stat] = next;
      changed.push(stat);
    }
  });
  return changed;
}

// ── Weakness Overcome Detection ──────────────────────────────────

const OVERCOME_THRESHOLD = 10; // positive signals in last 14 log entries

export function checkWeaknessOvercome(profile: Profile): {
  overcome: boolean;
  stat: string;
  bonus: number;
} | null {
  // only once
  if (profile.memory.milestones.some((m) => m.type === "weakness_overcome")) return null;
  const weaknessStat = WEAKNESS_MAP[profile.weakness_signal];
  if (!weaknessStat) return null;
  const last14 = profile.behavior_log.slice(-14);
  if (last14.length < 14) return null;
  const positiveSignals = last14.filter((e) => {
    if (weaknessStat === "focus") return e.response_depth === "thorough";
    if (weaknessStat === "consistency") return e.completedSameDay;
    if (weaknessStat === "adaptability") return e.difficulty_handled === "exceeded";
    if (weaknessStat === "execution") return e.completion_quality === "strong";
    return false;
  }).length;
  if (positiveSignals >= OVERCOME_THRESHOLD) {
    return { overcome: true, stat: weaknessStat, bonus: 3 };
  }
  return null;
}
