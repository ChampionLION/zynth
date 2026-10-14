"use client";

// LEADERBOARD — scopes, categories, podium, list, sticky user row.
// Climbing can trigger profession evolution (checked on load).

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRequireProfile } from "@/components/useRequireProfile";
import { useZynth } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { DOMAIN_COLORS } from "@/lib/ui";
import {
  getLeaderboard,
  checkProfessionEvolution,
  type Scope,
  type Category,
} from "@/lib/engines/leaderboard";
import { writeMilestone } from "@/lib/engines/memory";
import type { LeaderboardRow } from "@/lib/types";

const SCOPES: { key: Scope; label: string }[] = [
  { key: "local", label: "Local" },
  { key: "state", label: "State" },
  { key: "national", label: "National" },
  { key: "global", label: "Global" },
];
const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All Skills" },
  { key: "TECHNICAL", label: "Technical" },
  { key: "CREATIVE", label: "Creative" },
  { key: "ANALYTICAL", label: "Analytical" },
  { key: "SOCIAL", label: "Social" },
  { key: "STRATEGIC", label: "Strategic" },
];

export default function LeaderboardPage() {
  const { profile, hydrated } = useRequireProfile();
  const { setProfile } = useZynth();
  const [scope, setScope] = useState<Scope>("global");
  const [category, setCategory] = useState<Category>("all");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    void getLeaderboard(profile, scope, category).then(async (r) => {
      setRows(r.rows);
      setUserRank(r.userRank);
      setTotal(r.total);
      setLoading(false);

      // Profession evolution check — skill-category board only
      if (category === profile.domain && r.userRank > 0) {
        const evo = checkProfessionEvolution(profile, r.userRank, r.total);
        if (evo) {
          const p = structuredClone(profile);
          p.profession = evo.to;
          writeMilestone(p, "profession_evolution", {
            from: evo.from,
            to: evo.to,
            at_level: p.level,
          });
          await setProfile(p);
        }
      }
    });
  }, [profile?.user_id, scope, category]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated || !profile) return null;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <main className="app-page collection-page">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <span className="text-xs tracking-[0.2em] text-amber">ZYNTH</span>
      </div>

      {process.env.NEXT_PUBLIC_ZYNTH_MODE !== "live" && <p className="mt-3 text-xs text-muted">Demo rankings · sample players for preview</p>}
      {/* SCOPE TABS */}
      <div className="mt-4 flex rounded-lg border border-edge bg-surface p-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`flex-1 rounded-md py-1.5 text-xs transition-colors ${
              scope === s.key ? "bg-amber text-black" : "text-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* CATEGORY PILLS */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-colors ${
              category === c.key
                ? "bg-amber text-black"
                : "border border-edge text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* PODIUM */}
          <div className="mt-6 flex items-end justify-center gap-3">
            {podiumOrder.map((r) => {
              const isFirst = r.rank === 1;
              return (
                <motion.div
                  key={r.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-24 flex-col items-center rounded-t-xl border border-edge bg-surface px-2 pt-3 ${
                    isFirst ? "pb-8" : "pb-4"
                  } ${r.is_user ? "border-amber" : ""}`}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: DOMAIN_COLORS[r.domain] + "44", color: DOMAIN_COLORS[r.domain] }}
                  >
                    {r.display_name[0]}
                  </div>
                  <p className={`mt-1 text-lg font-black ${isFirst ? "text-gold" : "text-muted"}`}>
                    {r.rank}
                  </p>
                  <p className="max-w-full truncate text-[11px]">{r.display_name}</p>
                  <p className="text-[10px] text-dim">Lv {r.level}</p>
                  <p className="text-[11px] font-semibold text-amber">
                    {r.score.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* LIST */}
          <div className="mt-4 space-y-1.5">
            {rest.map((r) => (
              <div
                key={r.rank}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  r.is_user
                    ? "border-amber bg-amber/10"
                    : "border-edge bg-surface"
                }`}
              >
                <span className="w-8 text-sm font-bold text-muted">{r.rank}</span>
                <span className="flex-1 truncate text-sm">
                  {r.display_name}
                  {r.is_user && <span className="ml-1 text-[10px] text-amber">you</span>}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px]"
                  style={{
                    background: DOMAIN_COLORS[r.domain] + "22",
                    color: DOMAIN_COLORS[r.domain],
                  }}
                >
                  {r.domain.slice(0, 4)}
                </span>
                <span className="w-10 text-right text-xs text-dim">Lv {r.level}</span>
                <span className="w-16 text-right text-xs font-semibold text-amber">
                  {r.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* STICKY USER ROW */}
          {userRank > 0 && !rows.slice(0, 50).some((r) => r.is_user) && (
            <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-lg px-4">
              <div className="flex items-center gap-3 rounded-xl border border-amber bg-surface px-4 py-3 shadow-lg">
                <span className="w-10 text-sm font-bold text-amber">#{userRank}</span>
                <span className="flex-1 text-sm">You</span>
                <span className="text-xs text-dim">of {total.toLocaleString()}</span>
                <span className="text-xs font-semibold text-amber">
                  {profile.cumulative_exp.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          {userRank === 0 && (
            <p className="mt-6 text-center text-xs text-dim">
              You compete in the {profile.domain.toLowerCase()} category — switch to it to see your rank.
            </p>
          )}
        </>
      )}
      <BottomNav />
    </main>
  );
}
