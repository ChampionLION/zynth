// ─── Engine 6: Hidden Skill Engine ───────────────────────────────
// App-side pattern matching over response text + behavior history.

import type { Domain, Profile } from "../types";

export interface HiddenSkillDef {
  name: string;
  domain: Domain | "ANY";
  threshold: number;
  counterKey: string;
  /** returns true if this response/moment counts toward the skill */
  detect: (args: DetectArgs) => boolean;
}

interface DetectArgs {
  profile: Profile;
  responseText: string;
  grade: string;
}

const has = (text: string, patterns: RegExp[]) =>
  patterns.some((p) => p.test(text));

export const HIDDEN_SKILL_POOL: HiddenSkillDef[] = [
  {
    name: "Systems Thinking",
    domain: "ANALYTICAL",
    threshold: 5,
    counterKey: "systems_thinking",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(feedback loop|interconnect|ripple|downstream|upstream|system|ecosystem|cascade|second[- ]order)\b/i,
      ]),
  },
  {
    name: "Pattern Recognition",
    domain: "ANALYTICAL",
    threshold: 3,
    counterKey: "pattern_recognition",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(pattern|recurring|trend|correlat|every time|keeps happening|common thread)\b/i,
      ]),
  },
  {
    name: "Mentorship",
    domain: "SOCIAL",
    threshold: 4,
    counterKey: "mentorship",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(teach|explain to|showed (him|her|them)|help(ed|ing) (someone|them|others)|walk(ed)? (them|him|her) through)\b/i,
      ]),
  },
  {
    name: "Leadership",
    domain: "SOCIAL",
    threshold: 5,
    counterKey: "leadership",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(i('d| would)? (lead|organize|take charge|coordinate|rally)|my plan for (the team|us|everyone)|delegate)\b/i,
      ]),
  },
  {
    name: "Creative Synthesis",
    domain: "CREATIVE",
    threshold: 3,
    counterKey: "creative_synthesis",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(combine|merge|mashup|fusion|cross between|mix of|blend(ing)?|what if .* met)\b/i,
      ]),
  },
  {
    name: "Product Thinking",
    domain: "STRATEGIC",
    threshold: 3,
    counterKey: "product_thinking",
    detect: ({ responseText }) =>
      has(responseText, [/\buser\b/i]) &&
      has(responseText, [/\b(business|revenue|cost|market|monetiz)\b/i]) &&
      has(responseText, [/\b(tech|build|feature|implement|engineering)\b/i]),
  },
  {
    name: "Operations",
    domain: "STRATEGIC",
    threshold: 4,
    counterKey: "operations",
    detect: ({ responseText }) =>
      has(responseText, [
        /\b(workflow|logistics|schedule|process|pipeline|step[- ]by[- ]step|checklist|sequence)\b/i,
      ]),
  },
];

/** Event-based hidden skills checked outside response text. */
export function checkEventHiddenSkills(profile: Profile): string[] {
  const discovered: string[] = [];
  const already = new Set(
    profile.hidden_skills.filter((s) => s.discovered).map((s) => s.name)
  );

  // Discipline — 30-day streak
  if (profile.streak >= 30 && !already.has("Discipline")) discovered.push("Discipline");

  // Resilience — Excellent after 3+ consecutive Fails
  const h = profile.quest_history;
  if (!already.has("Resilience") && h.length >= 4) {
    const last = h[h.length - 1];
    const prevThree = h.slice(-4, -1);
    if (last.grade === "Excellent" && prevThree.every((q) => q.grade === "Fail")) {
      discovered.push("Resilience");
    }
  }

  // Deep Focus — 5+ 'thorough' response depths in a row
  if (!already.has("Deep Focus")) {
    const lastFive = profile.behavior_log.slice(-5);
    if (
      lastFive.length === 5 &&
      lastFive.every((e) => e.response_depth === "thorough")
    ) {
      discovered.push("Deep Focus");
    }
  }

  return discovered;
}

/** Text-based hidden skills: bump counters, return newly-thresholded names. */
export function checkTextHiddenSkills(
  profile: Profile,
  responseText: string,
  grade: string
): string[] {
  const discovered: string[] = [];
  const already = new Set(
    profile.hidden_skills.filter((s) => s.discovered).map((s) => s.name)
  );
  if (!profile.hidden_skill_counters) profile.hidden_skill_counters = {};

  for (const def of HIDDEN_SKILL_POOL) {
    if (already.has(def.name)) continue;
    if (def.domain !== "ANY" && def.domain !== profile.domain) continue;
    if (def.detect({ profile, responseText, grade })) {
      const n = (profile.hidden_skill_counters[def.counterKey] ?? 0) + 1;
      profile.hidden_skill_counters[def.counterKey] = n;
      if (n >= def.threshold) discovered.push(def.name);
    }
  }
  return discovered;
}
