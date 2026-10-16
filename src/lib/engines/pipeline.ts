// ─── Engine 3 orchestration: the Post-Grade 14-Step Pipeline ─────
// The app owns all math. The LLM only supplied strings and signals.

import type {
  BehaviorLogEntry,
  GradeResult,
  Profile,
  Quest,
  ZynthEvent,
} from "../types";
import {
  calculateFinalEXP,
  calculateStreakMultiplier,
  checkLevelUp,
  calculateSkillExpToNext,
  getSkillTier,
  getTitleForLevel,
  unlocksBetween,
  EXP_SIGNALS,
} from "./progression";
import { runStatEngine, applyStatDeltas, checkWeaknessOvercome } from "./stats";
import type { ExploitCheckResult } from "./exploit";
import {
  checkEventHiddenSkills,
  checkTextHiddenSkills,
} from "./hiddenSkills";
import { checkAchievements } from "./achievements";
import {
  awardXPCards,
  awardToken,
  XP_CARD_EARN_EVENTS,
} from "./economy";
import {
  writeMilestone,
  updatePersonalBests,
  snapshotStatsIfMilestone,
  logStruggle,
  resolveStruggle,
} from "./memory";
import { getDiscoveryMessage, getEvolvedSkillName, getBehaviorSummary } from "../llm/client";
import { daysSince, todayStr } from "./quest";
import { detectUserState } from "./adaptive";
import {isSuccessfulChallenge} from "./quest-cycle";

export interface PipelineResult {
  profile: Profile;
  expEarned: number;
  streakMultiplier: number;
  changedStats: string[];
  events: ZynthEvent[];
  leveledUp: boolean;
}
export interface PipelineEnrichment {
 skillName: typeof getEvolvedSkillName;
 discoveryMessage: typeof getDiscoveryMessage;
 behaviorSummary: typeof getBehaviorSummary;
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

export async function runPostGradePipeline(args: {
  profile: Profile;
  quest: Quest;
  gradeResult: GradeResult;
  responseText: string;
  responseTimeSeconds: number;
  exploit: ExploitCheckResult;
  swiftModeUsed: boolean;
  enrichment?: PipelineEnrichment;
}): Promise<PipelineResult> {
  if (args.profile.quest_history.some(q => q.quest_id === args.quest.id)) throw new Error("Quest already graded");
  if (args.exploit.rejected) throw new Error("Rejected submission cannot earn rewards");
  const profile = structuredClone(args.profile);
  const { quest, gradeResult, responseText, exploit } = args;
  const enrichment=args.enrichment??{skillName:getEvolvedSkillName,discoveryMessage:getDiscoveryMessage,behaviorSummary:getBehaviorSummary};
  const events: ZynthEvent[] = [];
  const now = new Date().toISOString();
  const today = todayStr();

  // Step 1: grade (already parsed + validated by Zod upstream)
  const grade = gradeResult.grade;

  // Step 5 (streak first — EXP multiplier depends on the updated streak
  // hitting today; blueprint orders streak after EXP but computes the
  // multiplier from the streak *including today's completion*)
  const wasBreak = daysSince(profile.last_active) >= 3;
  const alreadyCountedToday = profile.last_quest_date === today;
  let streakMilestoneHit: number | null = null;
  let tokenAwarded = false;
  if (grade !== "Fail" && !alreadyCountedToday) {
    // broke streak? save best first
    if (profile.last_quest_date) {
      const gap = Math.floor(
        (new Date(today).getTime() - new Date(profile.last_quest_date).getTime()) / 86400_000
      );
      if (gap > 1) {
        if (profile.streak > profile.memory.personal_bests.highest_streak) {
          profile.memory.personal_bests.highest_streak = profile.streak;
        }
        profile.streak = 0;
      }
    }
    profile.streak += 1;
    if (profile.streak > profile.streak_best) profile.streak_best = profile.streak;
    if (STREAK_MILESTONES.includes(profile.streak)) {
      streakMilestoneHit = profile.streak;
      tokenAwarded = awardToken(profile);
      events.push({
        kind: "streak_milestone",
        streak: profile.streak,
        multiplier: calculateStreakMultiplier(profile.streak),
        tokenAwarded,
      });
      if (profile.streak === 7) awardXPCards(profile, XP_CARD_EARN_EVENTS.streak_7, "streak_7");
      if (profile.streak === 30) awardXPCards(profile, XP_CARD_EARN_EVENTS.streak_30, "streak_30");
      if (profile.streak === 100) awardXPCards(profile, XP_CARD_EARN_EVENTS.streak_100, "streak_100");
    }
  }

  // Steps 2–3: exploit penalty + EXP calculation
  const expEarned = calculateFinalEXP(
    grade,
    profile.streak,
    profile.prestige_exp_bonus,
    quest.type,
    exploit.expPenalty
  );

  // Step 4: level-up check
  const beforeLevel = profile.level;
  const lvl = checkLevelUp(profile.level, profile.exp, expEarned);
  profile.exp = lvl.newExp;
  profile.exp_to_next = lvl.newExpToNext;
  profile.cumulative_exp += expEarned;
  if (profile.exp_today_date !== today) {
    profile.exp_today_date = today;
    profile.exp_earned_today = 0;
  }
  profile.exp_earned_today += expEarned;

  if (lvl.didLevelUp) {
    profile.level = lvl.newLevel;
    profile.title = getTitleForLevel(lvl.newLevel);
    const unlocked = unlocksBetween(beforeLevel, lvl.newLevel);
    unlocked.forEach((u) => {
      if (!profile.unlocks.includes(u)) profile.unlocks.push(u);
      if (u === "Swift Mode") profile.swift_mode_unlocked = true;
    });
    events.push({
      kind: "level_up",
      from: beforeLevel,
      to: lvl.newLevel,
      newTitle: lvl.newTitle,
      unlocks: unlocked,
    });
    // level milestone XP card every 5 levels
    for (let l = beforeLevel + 1; l <= lvl.newLevel; l++) {
      if (l % 5 === 0) awardXPCards(profile, XP_CARD_EARN_EVENTS.level_milestone, `level_${l}`);
    }
    snapshotStatsIfMilestone(profile);
  }

  // Step 6: append behavior log (cap 50)
  const logEntry: BehaviorLogEntry = {
    date: now,
    grade,
    quest_type: quest.type,
    response_depth: gradeResult.behavioral_signals.response_depth,
    domain_relevance: gradeResult.behavioral_signals.domain_relevance,
    difficulty_handled: gradeResult.behavioral_signals.difficulty_handled,
    completion_quality: gradeResult.behavioral_signals.completion_quality,
    completedSameDay: true,
    returnedAfterBreak: wasBreak,
  };
  profile.behavior_log.push(logEntry);
  if (profile.behavior_log.length > 50) {
    profile.behavior_log = profile.behavior_log.slice(-50);
  }

  // Steps 7–8: stat engine + apply with floor
  const deltas = runStatEngine(profile.behavior_log, profile.weakness_signal, streakMilestoneHit);
  const changedStats = applyStatDeltas(profile, deltas);

  // Step 9: skill EXP from LLM signals
  const firstExcellentEver =
    grade === "Excellent" &&
    !profile.quest_history.some((q) => q.grade === "Excellent");
  const creditedSkills = new Set<string>();
  for (const sp of gradeResult.skill_progress) {
    if (creditedSkills.has(sp.name)) continue;
    creditedSkills.add(sp.name);
    const skill = profile.skills.find((s) => s.name === sp.name);
    if (!skill) continue;
    skill.timesTargeted = (skill.timesTargeted ?? 0) + 1;
    skill.exp += EXP_SIGNALS[sp.exp_signal] ?? 5;
    while (skill.exp >= calculateSkillExpToNext(skill.level)) {
      skill.exp -= calculateSkillExpToNext(skill.level);
      skill.level += 1;
    }
  }

  // Step 10: skill evolution — LLM signal, or app counter (10th targeting)
  const evolutionCandidate =
    gradeResult.skill_evolution_signal ??
    profile.skills.find(
      (s) => (s.timesTargeted ?? 0) > 0 && (s.timesTargeted ?? 0) % 10 === 0 &&
        gradeResult.skill_progress.some((sp) => sp.name === s.name)
    )?.name ??
    null;
  if (evolutionCandidate) {
    const skill = profile.skills.find((s) => s.name === evolutionCandidate);
    if (skill) {
      const tier = getSkillTier(skill.level).tier;
      const newName = await enrichment.skillName(skill.name, profile, tier + 1);
      if (newName && newName !== skill.name) {
        const oldName = skill.name;
        skill.evolutions = [...(skill.evolutions ?? []), oldName];
        skill.name = newName;
        events.push({
          kind: "skill_evolution",
          skill: newName, oldName, newName,
          tier: tier + 1,
        });
        awardXPCards(profile, XP_CARD_EARN_EVENTS.skill_evolution, "skill_evolution");
        writeMilestone(profile, "first_skill_evolution", {
          from_skill: oldName, to_skill: newName, at_level: profile.level,
        });
        const hist = profile.memory.skill_history.find((h) => h.skill_name === oldName);
        if (hist) {
          hist.skill_name = newName;
          hist.evolutions.push(oldName);
          hist.current_level = skill.level;
        } else {
          profile.memory.skill_history.push({
            skill_name: newName, evolutions: [oldName], current_level: skill.level,
          });
        }
      }
    }
  }

  // Quest history entry (needed before achievements)
  profile.quest_history.push({
    quest_id: quest.id,
    quest_title: quest.quest_title,
    quest_type: quest.type,
    grade,
    exp_earned: expEarned,
    skills_targeted: quest.skills_targeted,
    completed_at: now,
    feedback: gradeResult.feedback,
    mentor_line: gradeResult.mentor_line,
    response: responseText.slice(0, 4000),
    swift_mode_used: args.swiftModeUsed,
    response_time_seconds: args.responseTimeSeconds,
  });


  // Hidden skill detection (Engine 6 — app-side patterns)
  if (grade !== "Fail") {
    const textDiscoveries = checkTextHiddenSkills(profile, responseText, grade);
    const eventDiscoveries = checkEventHiddenSkills(profile);
    const all = Array.from(new Set([...textDiscoveries, ...eventDiscoveries]));
    for (const name of all) {
      const message = await enrichment.discoveryMessage(name, profile);
      const existing = profile.hidden_skills.find((s) => s.name === name);
      if (existing) {
        existing.discovered = true;
        existing.discovered_at = now;
        existing.discovery_message = message;
      } else {
        profile.hidden_skills.push({
          name, level: 1, discovered: true,
          discovered_at: now, discovery_message: message,
        });
      }
      awardXPCards(profile, XP_CARD_EARN_EVENTS.hidden_skill, "hidden_skill");
      writeMilestone(profile, "first_hidden_skill", { skill: name, at_level: profile.level });
      writeMilestone(profile, "hidden_skill_discovered", { skill: name, at_level: profile.level });
      events.push({ kind: "hidden_skill", skill: name, message });
    }
  }

  // Memory: struggle log + first excellent
  if (grade === "Fail") logStruggle(profile, quest.type);
  else resolveStruggle(profile, quest.type);
  if (firstExcellentEver) {
    writeMilestone(profile, "first_excellent", {
      quest_title: quest.quest_title, at_level: profile.level,
    });
    awardXPCards(profile, XP_CARD_EARN_EVENTS.first_excellent, "first_excellent");
  } else if (grade === "Excellent") {
    awardXPCards(profile, XP_CARD_EARN_EVENTS.excellent_grade, "excellent");
  }
  if (quest.type === "mission" && isSuccessfulChallenge({grade})) {
    awardXPCards(profile, XP_CARD_EARN_EVENTS.mission_complete, "mission");
  }
  if (quest.type === "challenge" && grade !== "Fail") {
    awardXPCards(profile, XP_CARD_EARN_EVENTS.challenge_complete, "challenge");
  }

  // Step 11: achievements
  const newAchievements = checkAchievements(profile);
  for (const a of newAchievements) {
    awardXPCards(profile, a.xpCards + XP_CARD_EARN_EVENTS.achievement, `achievement_${a.id}`);
    events.push({
      kind: "achievement",
      id: a.id,
      name: a.visibility === "fully_hidden" ? revealHiddenName(a.id) : a.name,
      rarity: a.rarity,
      cards: a.xpCards,
    });
  }

  // Step 13: memory upkeep
  updatePersonalBests(profile, profile.exp_earned_today);

  // Step 14: weakness overcome
  const overcome = checkWeaknessOvercome(profile);
  if (overcome) {
    const statKey = overcome.stat as keyof typeof profile.stats;
    if (statKey === "focus" || statKey === "consistency" || statKey === "adaptability" || statKey === "execution") {
      profile.stats[statKey] += overcome.bonus;
      profile.onboarding_stats[statKey] += overcome.bonus; // permanent floor raise
    }
    const oldSig = profile.behavior_signature;
    const newSig = `${oldSig.replace(/^(hesitant|scattered|restless)_/, "")}`;
    profile.behavior_signature = newSig;
    writeMilestone(profile, "weakness_overcome", {
      weakness: profile.weakness_signal, stat: overcome.stat, at_level: profile.level,
    });
    awardXPCards(profile, XP_CARD_EARN_EVENTS.weakness_overcome, "weakness_overcome");
    events.push({
      kind: "weakness_overcome",
      stat: overcome.stat,
      oldSignature: oldSig,
      newSignature: newSig,
    });
  }

  // Behavior summary refresh every 10 quests (Engine 8 cache rule)
  if (
    profile.quest_history.length - profile.behavior_summary_quest_count >= 10
  ) {
    profile.behavior_summary_cache = await enrichment.behaviorSummary(profile);
    profile.behavior_summary_quest_count = profile.quest_history.length;
    if (profile.quest_history.length % 20 === 0) profile.memory.pattern_summary = profile.behavior_summary_cache;
  }

  // Adaptive state refresh
  profile.last_active = now;
  if (grade !== "Fail") profile.last_quest_date = today;
  const detected = detectUserState(profile);
  profile.current_adaptive_state = detected.state;
  profile.adaptive_state_updated_at = now;

  return {
    profile,
    expEarned,
    streakMultiplier: calculateStreakMultiplier(profile.streak),
    changedStats,
    events: events.sort((a,b) => {
      const order = ["level_up", "skill_evolution", "hidden_skill", "streak_milestone", "weakness_overcome", "achievement"];
      return order.indexOf(a.kind)-order.indexOf(b.kind);
    }),
    leveledUp: lvl.didLevelUp,
  };
}

function revealHiddenName(id: string): string {
  const names: Record<string, string> = {
    triple_shadow: "Triple Shadow",
    silent_discipline: "Silent Discipline",
    the_patient: "The Patient",
  };
  return names[id] ?? "???";
}
