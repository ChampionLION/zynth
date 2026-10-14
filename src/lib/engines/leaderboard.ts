// ─── Leaderboard System ──────────────────────────────────────────
// Mock mode: deterministic synthetic population around the user's
// score. Live mode: reads leaderboard_cache (computed by an Edge
// Function at midnight UTC — see supabase/schema.sql).

import type { Domain, LeaderboardRow, Profile } from "../types";
import { isLive, supabase } from "../db";

const FIRST = [
  "Marcus", "Aisha", "Kenji", "Sofia", "Dmitri", "Zara", "Leo", "Priya",
  "Omar", "Elena", "Tunde", "Mei", "Jonas", "Ines", "Ravi", "Nadia",
  "Caleb", "Yuki", "Andre", "Fatima", "Silas", "Chloe", "Ivan", "Amara",
];
const DOMAINS: Domain[] = ["ANALYTICAL", "TECHNICAL", "CREATIVE", "SOCIAL", "STRATEGIC"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(s, 48271) % 2147483647 + 2147483647) % 2147483647;
    return s / 2147483647;
  };
}

export type Scope = "local" | "state" | "national" | "global";
export type Category = "all" | Domain;

const SCOPE_SIZE: Record<Scope, number> = {
  local: 40,
  state: 250,
  national: 2500,
  global: 20000,
};

export async function getLeaderboard(
  profile: Profile,
  scope: Scope,
  category: Category
): Promise<{ rows: LeaderboardRow[]; userRank: number; total: number }> {
  if (isLive()) {
    const boardType = `${scope}_${category.toLowerCase()}`;
    const { data } = await supabase()
      .from("leaderboard_cache")
      .select("*")
      .eq("board_type", boardType)
      .order("rank", { ascending: true })
      .limit(100);
    if (data && data.length) {
      const rows: LeaderboardRow[] = data.map((r) => ({
        rank: r.rank, display_name: r.display_name, domain: r.domain,
        level: r.level, score: r.score, streak: r.streak,
        is_user: r.user_id === profile.user_id,
      }));
      const userRow = rows.find((r) => r.is_user);
      return { rows, userRank: userRow?.rank ?? rows.length + 1, total: rows.length };
    }
    // fall through to synthetic if cache empty
  }

  // synthetic population, deterministic per scope+category
  const seedBase =
    scope.length * 1000 + category.length * 77 +
    profile.user_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seedBase || 1);
  const total = Math.min(SCOPE_SIZE[scope], 200) + 1;
  const userScore = Math.max(1, profile.cumulative_exp);

  // Distribute scores log-normally; place the user realistically
  const pool: { name: string; domain: Domain; level: number; score: number; streak: number }[] = [];
  const populationTop = Math.max(userScore * 4, 800) * (scope === "global" ? 8 : scope === "national" ? 4 : scope === "state" ? 2 : 1);
  for (let i = 0; i < Math.min(SCOPE_SIZE[scope], 200); i++) {
    const pct = (i + 1) / Math.min(SCOPE_SIZE[scope], 200);
    const score = Math.round(populationTop * Math.pow(1 - pct, 2.2) * (0.85 + rand() * 0.3));
    const domain = category === "all" ? DOMAINS[Math.floor(rand() * DOMAINS.length)] : (category as Domain);
    pool.push({
      name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`,
      domain,
      level: Math.max(1, Math.round(Math.sqrt(score / 30))),
      score: Math.max(1, score),
      streak: Math.floor(rand() * 40),
    });
  }

  if (profile.leaderboard_opt_out || (category !== "all" && category !== profile.domain)) {
    // user not on this board
    const rows = pool
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((p, i) => ({
        rank: i + 1, display_name: p.name, domain: p.domain,
        level: p.level, score: p.score, streak: p.streak,
      }));
    return { rows, userRank: 0, total: pool.length };
  }

  const userRow = {
    name: displayName(profile),
    domain: profile.domain,
    level: profile.level,
    score: userScore,
    streak: profile.streak,
    isUser: true,
  };
  const merged = [...pool.map((p) => ({ ...p, isUser: false })), userRow].sort(
    (a, b) => b.score - a.score
  );
  const userRank = merged.findIndex((r) => r.isUser) + 1;
  const rows: LeaderboardRow[] = merged.slice(0, 50).map((p, i) => ({
    rank: i + 1,
    display_name: p.name,
    domain: p.domain,
    level: p.level,
    score: p.score,
    streak: p.streak,
    is_user: p.isUser,
  }));
  return { rows, userRank, total };
}

export function displayName(profile: Profile): string {
  const parts = profile.display_name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
  return parts[0] ?? "You";
}

// ── Profession evolution via leaderboard rank ────────────────────

export function checkProfessionEvolution(
  profile: Profile,
  userRank: number,
  total: number
): { from: string; to: string } | null {
  if (userRank === 0 || total === 0) return null;
  const pct = userRank / total;
  const prof = profile.profession;
  if (/^(Senior|Lead|Principal|Director|Creative Director)/.test(prof)) {
    // already evolved at least once; only evolve further at 5%
    if (pct <= 0.05 && /^Senior/.test(prof)) {
      return { from: prof, to: prof.replace(/^Senior/, "Principal") };
    }
    return null;
  }
  if (pct <= 0.05) return { from: prof, to: `Principal ${prof}` };
  if (pct <= 0.1) return { from: prof, to: `Lead ${prof}` };
  if (pct <= 0.25) return { from: prof, to: `Senior ${prof}` };
  return null;
}
