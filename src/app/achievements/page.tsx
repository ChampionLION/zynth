"use client";

// ACHIEVEMENTS — rarity sections, hidden treatment, milestones timeline.

import { useRouter } from "next/navigation";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import { ACHIEVEMENTS, type Rarity } from "@/lib/engines/achievements";
import { formatDate, display } from "@/lib/ui";

const RARITY_ORDER: Rarity[] = ["Legendary", "Rare", "Uncommon", "Common"];
const RARITY_COLORS: Record<Rarity, string> = {
  Legendary: "var(--grade-excellent)",
  Rare: "rgb(var(--domain-technical))",
  Uncommon: "var(--grade-good)",
  Common: "rgb(var(--color-muted))",
};

export default function AchievementsPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  if (!hydrated || !profile) return null;

  const unlocked = new Set(profile.achievements_unlocked);
  const visibleCount = ACHIEVEMENTS.filter(
    (a) => a.visibility !== "fully_hidden" || unlocked.has(a.id)
  ).length;

  const milestones = [...profile.memory.milestones]
    .filter((m) =>
      ["first_excellent", "first_skill_evolution", "first_hidden_skill",
       "hidden_skill_discovered", "profession_evolution", "prestige",
       "weakness_overcome"].includes(m.type)
    )
    .reverse();

  return (
    <main className="app-page collection-page">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-xl text-muted">←</button>
        <h1 className="text-xl font-bold">Achievements</h1>
      </div>
      <p className="mt-1 text-xs text-muted">
        {unlocked.size} of {visibleCount} unlocked
      </p>

      {RARITY_ORDER.map((rarity) => {
        const items = ACHIEVEMENTS.filter((a) => a.rarity === rarity);
        if (!items.length) return null;
        return (
          <section key={rarity} className="mt-6">
            <h2
              className="text-xs font-semibold tracking-[0.2em]"
              style={{ color: RARITY_COLORS[rarity] }}
            >
              {rarity.toUpperCase()}
            </h2>
            <div className="mt-2 space-y-2">
              {items.map((a) => {
                const isUnlocked = unlocked.has(a.id);
                const isSecret = a.visibility === "fully_hidden" && !isUnlocked;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isUnlocked
                        ? "border-edge bg-surface"
                        : "border-edge/50 bg-surface/50"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm"
                      style={{
                        borderColor: isUnlocked ? RARITY_COLORS[rarity] : "rgb(var(--color-edge))",
                        color: isUnlocked ? RARITY_COLORS[rarity] : "rgb(var(--color-muted))",
                      }}
                    >
                      {isSecret ? "?" : "★"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {isSecret ? "???" : a.name === "???" && isUnlocked ? revealName(a.id) : a.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {isSecret ? "Hidden — discover it" : isUnlocked ? a.description : a.visibility === "hidden" ? "Hidden condition" : a.description}
                      </p>
                    </div>
                    {a.xpCards > 0 && isUnlocked && (
                      <span className="ml-auto shrink-0 text-xs text-teal">
                        ⬡{a.xpCards}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* MILESTONES */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">
          MILESTONES
        </h2>
        {milestones.length === 0 ? (
          <p className="mt-3 text-sm text-dim">
            Your story hasn&apos;t been written yet.
          </p>
        ) : (
          <div className="mt-3 space-y-0">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber" />
                  {i < milestones.length - 1 && <span className="w-px flex-1 bg-edge" />}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-medium">{milestoneLabel(m)}</p>
                  <p className="text-xs text-dim">{formatDate(m.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <BottomNav />
    </main>
  );
}

function revealName(id: string): string {
  return (
    { triple_shadow: "Triple Shadow", silent_discipline: "Silent Discipline", the_patient: "The Patient" }[id] ?? "???"
  );
}

function milestoneLabel(m: { type: string; [k: string]: unknown }): string {
  switch (m.type) {
    case "first_excellent":
      return `First Excellent — "${m.quest_title}"`;
    case "first_skill_evolution":
      return `${display(String(m.from_skill))} evolved into ${display(String(m.to_skill))}`;
    case "first_hidden_skill":
    case "hidden_skill_discovered":
      return `Hidden skill discovered: ${display(String(m.skill))}`;
    case "profession_evolution":
      return `Became ${m.to}`;
    case "prestige":
      return `Prestige ${m.prestige_number}`;
    case "weakness_overcome":
      return `Overcame ${display(String(m.weakness))}`;
    default:
      return m.type;
  }
}
