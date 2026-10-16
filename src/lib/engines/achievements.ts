// ─── Engine 11: Achievement Engine ───────────────────────────────

import type { Profile } from "../types";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Legendary";
export type Visibility = "visible" | "hidden" | "slot_visible" | "fully_hidden";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  xpCards: number;
  visibility: Visibility;
  check: (profile: Profile) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_flame", name: "First Flame", description: "Reach a 3-day streak",
    rarity: "Common", xpCards: 0, visibility: "visible",
    check: (p) => p.streak >= 3 || p.streak_best >= 3,
  },
  {
    id: "week_forged", name: "Week Marked", description: "Reach a 7-day streak",
    rarity: "Common", xpCards: 1, visibility: "visible",
    check: (p) => p.streak >= 7 || p.streak_best >= 7,
  },
  {
    id: "century_streak", name: "Century", description: "Reach a 100-day streak",
    rarity: "Legendary", xpCards: 10, visibility: "visible",
    check: (p) => p.streak >= 100 || p.streak_best >= 100,
  },
  {
    id: "first_excellent", name: "Sharp", description: "Earn your first Excellent",
    rarity: "Common", xpCards: 1, visibility: "visible",
    check: (p) => p.quest_history.some((q) => q.grade === "Excellent"),
  },
  {
    id: "flawless_week", name: "Flawless Week",
    description: "Excellent or Good every day for 7 straight days",
    rarity: "Rare", xpCards: 3, visibility: "hidden",
    check: (p) => {
      const days=new Map<string,{date:string;successful:boolean}>();
      for(const quest of [...p.quest_history].sort((a,b)=>a.completed_at.localeCompare(b.completed_at))){
        const day=quest.completed_at.slice(0,10),previous=days.get(day);
        days.set(day,{date:day,successful:(previous?.successful??true)&&(quest.grade==="Excellent"||quest.grade==="Good")});
      }
      const last7 = [...days.values()].slice(-7);
      return (
        last7.length === 7 &&
        last7.every(q=>q.successful) &&
        last7.every((q,i) => i===0 || Math.round((Date.parse(q.date)-Date.parse(last7[i-1].date))/86400_000)===1)
      );
    },
  },
  {
    id: "comeback_king", name: "Comeback",
    description: "Score Excellent immediately after a Fail",
    rarity: "Rare", xpCards: 2, visibility: "hidden",
    check: (p) => {
      const h = p.quest_history;
      for (let i = 1; i < h.length; i++) {
        if (h[i].grade === "Excellent" && h[i - 1].grade === "Fail") return true;
      }
      return false;
    },
  },
  {
    id: "apprentice", name: "Apprentice", description: "Reach Level 5",
    rarity: "Common", xpCards: 0, visibility: "visible",
    check: (p) => p.level >= 5,
  },
  {
    id: "triple_digits", name: "Triple Digits", description: "Reach Level 100",
    rarity: "Legendary", xpCards: 15, visibility: "visible",
    check: (p) => p.level >= 100,
  },
  {
    id: "prestige_one", name: "Reborn", description: "Complete your first Prestige",
    rarity: "Legendary", xpCards: 15, visibility: "visible",
    check: (p) => p.prestige >= 1,
  },
  {
    id: "first_evolution", name: "Metamorphosis",
    description: "Evolve a skill for the first time",
    rarity: "Uncommon", xpCards: 2, visibility: "visible",
    check: (p) => p.skills.some((s) => (s.evolutions?.length ?? 0) > 0),
  },
  {
    id: "master_tier", name: "Mastery", description: "Reach Tier 6 on any skill",
    rarity: "Legendary", xpCards: 10, visibility: "visible",
    check: (p) => p.skills.some((s) => s.level >= 100),
  },
  {
    id: "shadow_talent", name: "Shadow Talent",
    description: "Discover your first hidden skill",
    rarity: "Rare", xpCards: 5, visibility: "slot_visible",
    check: (p) => p.hidden_skills.some((s) => s.discovered),
  },
  {
    id: "triple_shadow", name: "???", description: "Discover 3 hidden skills",
    rarity: "Legendary", xpCards: 8, visibility: "fully_hidden",
    check: (p) => p.hidden_skills.filter((s) => s.discovered).length >= 3,
  },
  {
    id: "silent_discipline", name: "???",
    description: "Complete 30 quests without using Swift Mode",
    rarity: "Rare", xpCards: 4, visibility: "fully_hidden",
    check: (p) =>
      p.quest_history.length >= 30 &&
      p.quest_history.slice(-30).every((q) => !q.swift_mode_used),
  },
  {
    id: "the_patient", name: "???",
    description: "Fail three times, then score Excellent on the fourth",
    rarity: "Legendary", xpCards: 6, visibility: "fully_hidden",
    check: (p) => {
      const h = p.quest_history;
      for (let i = 3; i < h.length; i++) {
        if (
          h[i].grade === "Excellent" &&
          h[i - 1].grade === "Fail" &&
          h[i - 2].grade === "Fail" &&
          h[i - 3].grade === "Fail"
        )
          return true;
      }
      return false;
    },
  },
];

export function checkAchievements(profile: Profile): AchievementDef[] {
  const unlocked = new Set(profile.achievements_unlocked ?? []);
  const newly: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    if (a.check(profile)) {
      newly.push(a);
      profile.achievements_unlocked.push(a.id);
    }
  }
  return newly;
}
