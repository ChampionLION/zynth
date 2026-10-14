// ─── Engine 9: Memory Engine ─────────────────────────────────────

import type { Memory, Profile } from "../types";

export function emptyMemory(): Memory {
  return {
    milestones: [],
    stat_history: [],
    skill_history: [],
    pattern_summary: null,
    struggle_log: [],
    personal_bests: {
      highest_streak: 0,
      most_exp_in_day: 0,
      highest_skill_level: { name: "", level: 0 },
      fastest_level_up: { from_level: 0, to_level: 0, quests_taken: 0 },
    },
  };
}

export function writeMilestone(
  profile: Profile,
  type: string,
  data: Record<string, unknown> = {}
): void {
  // once-ever milestone types
  const onceEver = [
    "first_excellent",
    "first_skill_evolution",
    "first_hidden_skill",
  ];
  if (onceEver.includes(type) && profile.memory.milestones.some((m) => m.type === type))
    return;
  profile.memory.milestones.push({
    type,
    date: new Date().toISOString(),
    ...data,
  });
}

export function updatePersonalBests(profile: Profile, expEarnedToday: number): void {
  const pb = profile.memory.personal_bests;
  if (profile.streak > pb.highest_streak) pb.highest_streak = profile.streak;
  if (expEarnedToday > pb.most_exp_in_day) pb.most_exp_in_day = expEarnedToday;
  for (const s of profile.skills) {
    if (s.level > pb.highest_skill_level.level) {
      pb.highest_skill_level = { name: s.name, level: s.level };
    }
  }
}

export function snapshotStatsIfMilestone(profile: Profile): void {
  if (profile.level % 10 !== 0) return;
  if (profile.memory.stat_history.some((s) => s.at_level === profile.level)) return;
  profile.memory.stat_history.push({
    at_level: profile.level,
    stats: {
      focus: profile.stats.focus,
      consistency: profile.stats.consistency,
      adaptability: profile.stats.adaptability,
      execution: profile.stats.execution,
      [profile.stats.stat_5.name]: profile.stats.stat_5.value,
      [profile.stats.stat_6.name]: profile.stats.stat_6.value,
    },
    date: new Date().toISOString(),
  });
}

export function logStruggle(profile: Profile, questType: string): void {
  const existing = profile.memory.struggle_log.find(
    (s) => s.quest_type === questType && !s.eventually_passed
  );
  if (existing) existing.fail_count += 1;
  else
    profile.memory.struggle_log.push({
      quest_type: questType,
      domain: profile.domain,
      fail_count: 1,
      eventually_passed: false,
    });
}

export function resolveStruggle(profile: Profile, questType: string): void {
  const existing = profile.memory.struggle_log.find(
    (s) => s.quest_type === questType && !s.eventually_passed
  );
  if (existing) existing.eventually_passed = true;
}
