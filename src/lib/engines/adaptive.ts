// ─── Engine 12: Adaptive Intelligence ────────────────────────────

import type { AdaptiveState, Profile } from "../types";
import { daysSince, todayStr } from "./quest";

function getTrailingCount(grades: string[], target: string): number {
  let n = 0;
  for (let i = grades.length - 1; i >= 0; i--) {
    if (grades[i] === target) n++;
    else break;
  }
  return n;
}

export function detectUserState(profile: Profile): {
  state: AdaptiveState;
  confidence: number;
} {
  const recentLog = profile.behavior_log.slice(-10);
  const recentGrades = profile.quest_history.slice(-7).map((q) => q.grade);
  const sinceActive = daysSince(profile.last_active);

  const scores: Record<AdaptiveState, number> = {
    bored: 0, burned_out: 0, stagnant: 0,
    struggling: 0, returning: 0, peaking: 0, optimal: 0,
  };

  // BORED
  const excellentTrail = getTrailingCount(recentGrades, "Excellent");
  if (excellentTrail >= 5) scores.bored += 3;
  const rushed = recentLog.filter((e) => e.response_depth === "rushed").length;
  if (rushed >= 3) scores.bored += 2;

  // BURNED_OUT
  const failCount = recentGrades.filter((g) => g === "Fail").length;
  if (failCount >= 3) scores.burned_out += 3;
  if (sinceActive >= 2 && sinceActive < 7) scores.burned_out += 2;

  // STAGNANT
  const basicCount = recentGrades.filter((g) => g === "Basic").length;
  if (basicCount >= 4) scores.stagnant += 2;

  // STRUGGLING
  if (failCount >= 4) scores.struggling += 4;
  const badCount = recentGrades.filter((g) => g === "Bad").length;
  if (badCount + failCount >= 5) scores.struggling += 3;

  // RETURNING
  if (sinceActive >= 3) scores.returning += 5;

  // PEAKING
  if (excellentTrail >= 3 && profile.streak >= 7) scores.peaking += 4;

  scores.optimal += 1;

  // low energy today softly biases toward burnout handling
  if (profile.energy_date === todayStr() && profile.energy_today === "low") scores.burned_out += 1;
  if (profile.energy_date === todayStr() && profile.energy_today === "high") scores.peaking += 1;

  const dominant = (Object.entries(scores) as [AdaptiveState, number][]).sort(
    ([, a], [, b]) => b - a
  )[0];
  return { state: dominant[0], confidence: dominant[1] };
}

export const STATE_PROMPT_INJECTIONS: Record<AdaptiveState, string> = {
  optimal: "",
  bored:
    "This user is showing boredom signals — too many easy Excellents. Generate a quest that genuinely challenges them. Push the difficulty. Make them think harder than usual.",
  burned_out:
    "This user is showing burnout signals — recent failures, reduced engagement. Generate a shorter, more achievable quest. Tone: supportive. Goal is to rebuild momentum, not challenge further.",
  stagnant:
    "This user has plateaued. Generate a quest that approaches their skills from a completely different angle. Break the format pattern.",
  struggling:
    "This user is struggling significantly. Be gentle. Generate the simplest possible version of a quest in their domain. This quest should feel winnable.",
  returning:
    "This user is returning after an absence. Generate a re-entry quest that feels like a warm welcome back. Make them feel like the system remembers them. Keep it short.",
  peaking:
    "This user is on a peak run — excellent grades, strong streak. Match their energy. Raise the stakes slightly. Make this feel like a chapter boss fight.",
};
