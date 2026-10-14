// ─── Engine 8: Context Compression ───────────────────────────────

import type { Profile } from "../types";

function compressStats(stats: Profile["stats"]): Record<string, number> {
  return {
    focus: stats.focus,
    consistency: stats.consistency,
    adaptability: stats.adaptability,
    execution: stats.execution,
    [`domain_${stats.stat_5.name}`]: stats.stat_5.value,
    [`domain_${stats.stat_6.name}`]: stats.stat_6.value,
  };
}

function compressSkills(skills: Profile["skills"]): string {
  return skills.map((s) => `${s.name} (Lv${s.level})`).join(", ");
}

function buildMemoryContext(profile: Profile): string | null {
  const facts: string[] = [];
  const m = profile.memory;
  if (m.personal_bests.highest_streak > 0)
    facts.push(`best streak ${m.personal_bests.highest_streak} days`);
  if (m.personal_bests.highest_skill_level.level > 0)
    facts.push(
      `strongest skill ${m.personal_bests.highest_skill_level.name} Lv${m.personal_bests.highest_skill_level.level}`
    );
  const evolution = m.milestones.find((x) => x.type === "first_skill_evolution");
  if (evolution) facts.push(`evolved ${evolution.from_skill} into ${evolution.to_skill}`);
  const overcome = m.milestones.find((x) => x.type === "weakness_overcome");
  if (overcome) facts.push(`overcame ${overcome.weakness}`);
  if (m.pattern_summary) facts.push(m.pattern_summary);
  return facts.length ? facts.slice(0, 5).join("; ") : null;
}

function buildProfileInsights(profile: Profile): string[] {
  return profile.continuous_profile_answers
    .filter((a) => a.answer_label)
    .slice(-10)
    .map((a) => `${a.category}: ${a.answer_label}`);
}

export function buildCompressedContext(
  profile: Profile,
  purpose: "quest_generation" | "grading"
): Record<string, unknown> {
  const base = {
    profession: profile.profession,
    aspiration: profile.aspiration ?? null,
    domain: profile.domain,
    behavior_signature: profile.behavior_signature,
    weakness_signal: profile.weakness_signal,
    learning_style: profile.learning_style,
    level: profile.level,
    stats: compressStats(profile.stats),
  };
  if (purpose === "quest_generation") {
    return {
      ...base,
      skills: compressSkills(profile.skills),
      hidden_skills_discovered: profile.hidden_skills
        .filter((s) => s.discovered)
        .map((s) => s.name),
      recent_performance: profile.quest_history.slice(-5).map((q) => q.grade),
      behavior_summary: profile.behavior_summary_cache,
      memory_context: profile.level >= 20 ? buildMemoryContext(profile) : null,
      continuous_profile_insights: buildProfileInsights(profile),
    };
  }
  return {
    ...base,
    skills: compressSkills(profile.skills),
    recent_grades: profile.quest_history.slice(-5).map((q) => q.grade),
  };
}
