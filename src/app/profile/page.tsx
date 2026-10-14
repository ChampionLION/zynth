"use client";

// PROFILE — identity, radar chart, skills, hidden skills, stats,
// engagement, links to achievements/settings/prestige.

import { useRouter } from "next/navigation";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import { DOMAIN_COLORS, display, formatDate } from "@/lib/ui";
import { getSkillTier, calculateSkillExpToNext } from "@/lib/engines/progression";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  if (!hydrated || !profile) return null;

  const color = DOMAIN_COLORS[profile.domain];
  const discovered = profile.hidden_skills.filter((s) => s.discovered);

  return (
    <main className="app-page collection-page">
      {/* TOP */}
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-purple px-3 py-1 text-xs font-bold">
          Lv {profile.level}
        </span>
        <span className="text-sm text-amber">{profile.title}</span>
        {profile.prestige > 0 && (
          <span className="rounded-full border border-gold px-2 py-0.5 text-[10px] text-gold">
            Prestige {profile.prestige}
          </span>
        )}
      </div>
      <h1 className="mt-2 text-2xl font-bold">{profile.profession}</h1>
      <span
        className="mt-1 inline-block rounded-full border px-3 py-0.5 text-xs tracking-widest"
        style={{ borderColor: color, color }}
      >
        {profile.domain}
      </span>
      <p className="mt-2 font-mono text-sm text-amber">
        {display(profile.behavior_signature)}
      </p>

      {/* RADAR */}
      <div className="mt-6 rounded-2xl border border-edge bg-surface p-4">
        <RadarChart profile={profile} color={color} />
      </div>

      {/* SKILLS */}
      <h2 className="mt-6 text-sm font-semibold tracking-widest text-muted">
        SKILLS
      </h2>
      <div className="mt-2 space-y-2">
        {profile.skills.map((s) => {
          const tier = getSkillTier(s.level);
          const toNext = calculateSkillExpToNext(s.level);
          return (
            <div key={s.name} className="rounded-xl border border-edge bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-amber">{display(s.name)}</span>
                <span className="rounded-full border border-edge px-2 py-0.5 text-[10px] text-muted">
                  Tier {tier.tier} · {tier.name}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
                  <div
                    className="h-full rounded-full bg-amber"
                    style={{ width: `${Math.min(100, (s.exp / toNext) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">Lv {s.level}</span>
              </div>
              {(s.evolutions?.length ?? 0) > 0 && (
                <p className="mt-1.5 text-[10px] text-dim">
                  evolved from {s.evolutions!.map(display).join(" → ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* HIDDEN SKILLS */}
      <h2 className="mt-6 text-sm font-semibold tracking-widest text-muted">
        HIDDEN SKILLS
      </h2>
      <div className="mt-2 space-y-1.5">
        {discovered.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-xl border border-teal/40 bg-teal/5 px-4 py-3"
          >
            <span className="font-mono text-sm text-teal">{display(s.name)}</span>
            <span className="text-xs text-teal">Lv {s.level}</span>
          </div>
        ))}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center rounded-xl border border-edge bg-surface px-4 py-3"
          >
            <span className="font-mono text-sm text-dim">???</span>
          </div>
        ))}
      </div>

      {/* STATS GRID */}
      <h2 className="mt-6 text-sm font-semibold tracking-widest text-muted">STATS</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(
          [
            ["Focus", profile.stats.focus],
            ["Consistency", profile.stats.consistency],
            ["Adaptability", profile.stats.adaptability],
            ["Execution", profile.stats.execution],
            [profile.stats.stat_5.name, profile.stats.stat_5.value],
            [profile.stats.stat_6.name, profile.stats.stat_6.value],
          ] as [string, number][]
        ).map(([name, value]) => (
          <div key={name} className="rounded-xl border border-edge bg-surface px-4 py-3">
            <p className="text-[11px] text-muted">{display(name)}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* ENGAGEMENT */}
      <div className="mt-6 grid grid-cols-2 gap-2 text-center">
        <Stat label="Streak" value={`${profile.streak} 🔥`} />
        <Stat label="Best streak" value={String(profile.streak_best)} />
        <Stat label="Quests" value={String(profile.quest_history.length)} />
        <Stat label="Member since" value={formatDate(profile.created_at)} />
      </div>

      {/* ECONOMY */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 rounded-xl border border-edge bg-surface px-4 py-3 text-center">
          <p className="text-lg font-bold text-amber">◈ {profile.tokens}</p>
          <p className="text-[10px] text-muted">Skip Tokens</p>
        </div>
        <div className="flex-1 rounded-xl border border-edge bg-surface px-4 py-3 text-center">
          <p className="text-lg font-bold text-teal">⬡ {profile.xp_cards}</p>
          <p className="text-[10px] text-muted">XP Cards</p>
        </div>
      </div>

      {/* LINKS */}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => router.push("/achievements")}
          className="w-full rounded-xl border border-edge bg-surface px-4 py-3.5 text-left text-sm"
        >
          ★ Achievements
          <span className="float-right text-muted">→</span>
        </button>
        {profile.level >= 100 && (
          <button
            onClick={() => router.push("/prestige")}
            className="w-full rounded-xl border border-gold bg-surface px-4 py-3.5 text-left text-sm text-gold"
          >
            ✦ Prestige
            <span className="float-right">→</span>
          </button>
        )}
        <button
          onClick={() => router.push("/settings")}
          className="w-full rounded-xl border border-edge bg-surface px-4 py-3.5 text-left text-sm"
        >
          ⚙ Settings
          <span className="float-right text-muted">→</span>
        </button>
      </div>
      <BottomNav />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-edge bg-surface px-3 py-3">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function RadarChart({
  profile,
  color,
}: {
  profile: NonNullable<ReturnType<typeof useRequireProfile>["profile"]>;
  color: string;
}) {
  const stats: [string, number][] = [
    ["Focus", profile.stats.focus],
    ["Consistency", profile.stats.consistency],
    ["Adaptability", profile.stats.adaptability],
    ["Execution", profile.stats.execution],
    [profile.stats.stat_5.name, profile.stats.stat_5.value],
    [profile.stats.stat_6.name, profile.stats.stat_6.value],
  ];
  const MAX = 25;
  const cx = 150, cy = 130, R = 95;
  const angle = (i: number) => (Math.PI * 2 * i) / 6 - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [
    cx + Math.cos(angle(i)) * r,
    cy + Math.sin(angle(i)) * r,
  ];
  const polygon = stats
    .map(([, v], i) => point(i, (Math.min(v, MAX) / MAX) * R).join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 300 270" className="w-full">
      {[5, 10, 15, 20, 25].map((ring) => (
        <polygon
          key={ring}
          points={stats.map((_, i) => point(i, (ring / MAX) * R).join(",")).join(" ")}
          fill="none"
          stroke="#2A2A3A"
          strokeWidth="1"
        />
      ))}
      {stats.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2A2A3A" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
      {stats.map(([name, v], i) => {
        const [x, y] = point(i, R + 22);
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#8888A0]"
            fontSize="10"
          >
            {display(name)} {v}
          </text>
        );
      })}
    </svg>
  );
}
