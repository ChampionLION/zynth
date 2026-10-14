// ─── Engine 10: Economy Engine ───────────────────────────────────

import type { Profile } from "../types";

export const TOKEN_MAX = 5;
export const XP_CARD_MAX = 20;
export const XP_CARD_EXPIRY_DAYS = 30;

export function awardXPCards(profile: Profile, count: number, source: string): number {
  pruneExpiredCards(profile);
  const room = XP_CARD_MAX - profile.xp_cards;
  const granted = Math.max(0, Math.min(room, count));
  if (granted > 0) {
    profile.xp_cards += granted;
    profile.xp_card_log.push({
      earned_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + XP_CARD_EXPIRY_DAYS * 86400_000).toISOString(),
      source,
      count: granted,
    });
  }
  return granted;
}

export function spendXPCards(profile: Profile, count: number): boolean {
  pruneExpiredCards(profile);
  if (!Number.isInteger(count) || count <= 0) return false;
  if (profile.xp_cards < count) return false;
  profile.xp_cards -= count;
  let remaining = count;
  profile.xp_card_log.sort((a,b)=>Date.parse(a.expires_at)-Date.parse(b.expires_at));
  for (const entry of profile.xp_card_log) { const used=Math.min(entry.count,remaining); entry.count-=used; remaining-=used; if (!remaining) break; }
  profile.xp_card_log=profile.xp_card_log.filter(e=>e.count>0);
  return true;
}

export function pruneExpiredCards(profile: Profile): void {
  const now = Date.now();
  let expired = 0;
  profile.xp_card_log = profile.xp_card_log.filter((entry) => {
    if (new Date(entry.expires_at).getTime() < now) {
      expired += entry.count;
      return false;
    }
    return true;
  });
  if (expired > 0) {
    profile.xp_cards = Math.max(0, profile.xp_cards - expired);
  }
}

export function awardToken(profile: Profile): boolean {
  if (profile.tokens >= TOKEN_MAX) return false;
  profile.tokens += 1;
  return true;
}

export function spendToken(profile: Profile, count = 1): boolean {
  if (!Number.isInteger(count) || count <= 0) return false;
  if (profile.tokens < count) return false;
  profile.tokens -= count;
  return true;
}

export const XP_CARD_COSTS = {
  retest: 2,
  reduce_difficulty: 1,
  hint_upgrade: 1,
  bonus_quest: 3,
} as const;

export const XP_CARD_EARN_EVENTS = {
  excellent_grade: 1,
  first_excellent: 3,
  mission_complete: 2,
  challenge_complete: 3,
  hidden_skill: 5,
  streak_7: 1,
  streak_30: 3,
  streak_100: 10,
  skill_evolution: 2,
  level_milestone: 1, // every 5 levels
  prestige: 15,
  weakness_overcome: 5,
  achievement: 1,
} as const;
