"use client";

// CHRONICLE — My Chronicle (history) + Community (top responses).

import { useState } from "react";
import { motion } from "framer-motion";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import { GRADE_COLORS, formatDate, display } from "@/lib/ui";

const COMMUNITY_SAMPLES = [
  {
    domain: "TECHNICAL",
    excerpt:
      "I'd rebuild the notification system as a pull model — the app asks 'what matters right now?' instead of everything shouting at once. Components: a priority queue, a quiet-hours gate, and a digest compiler...",
  },
  {
    domain: "CREATIVE",
    excerpt:
      "The café exists between two buildings that forgot about it. Rain sounds different here — softer, like it's apologizing. The menu is handwritten by whoever opened that morning...",
  },
  {
    domain: "ANALYTICAL",
    excerpt:
      "The obvious explanation is laziness. The hidden variable is decision cost: every option added to my morning increased the odds I'd do none of them. Test: remove all but one choice for a week...",
  },
  {
    domain: "SOCIAL",
    excerpt:
      "What he actually wants isn't credit — it's evidence that leaving his old job mattered. So the bridge sentence isn't about the project at all. It's: 'none of this existed before you came'...",
  },
  {
    domain: "STRATEGIC",
    excerpt:
      "Phase one is deliberately boring: thirty days of inventory before a single decision. Most campaigns die from moving before counting. The checkpoint is simple — can I predict next week's numbers?...",
  },
];

export default function ChroniclePage() {
  const { profile, hydrated } = useRequireProfile();
  const [tab, setTab] = useState<"mine" | "community">("mine");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("all");

  if (!hydrated || !profile) return null;

  const history = [...profile.quest_history].reverse();
  const community =
    domainFilter === "all"
      ? COMMUNITY_SAMPLES
      : COMMUNITY_SAMPLES.filter((c) => c.domain === domainFilter);

  return (
    <main className="app-page collection-page">
      <h1 className="text-xl font-bold">Chronicle</h1>
      {tab === "community" && <p className="mt-3 text-xs text-muted">Illustrative responses · curated examples, not live community posts.</p>}

      <div className="mt-4 flex gap-2">
        {(
          [
            ["mine", "My Chronicle"],
            ["community", "Community"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === key
                ? "bg-amber text-black"
                : "border border-edge text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <div className="mt-5 space-y-3">
          {history.length === 0 && (
            <p className="py-16 text-center text-sm text-dim">
              Your chronicle begins with your first quest.
            </p>
          )}
          {history.map((q) => (
            <motion.button
              key={q.quest_id + q.completed_at}
              layout
              onClick={() =>
                setExpanded(expanded === q.quest_id ? null : q.quest_id)
              }
              className="w-full rounded-xl border border-edge bg-surface p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{q.quest_title}</p>
                  <p className="mt-0.5 text-xs text-dim">
                    {formatDate(q.completed_at)} ·{" "}
                    <span className="text-amber">+{q.exp_earned} EXP</span>
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-xs"
                  style={{
                    borderColor: GRADE_COLORS[q.grade].border,
                    color: GRADE_COLORS[q.grade].text,
                  }}
                >
                  {q.grade}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {q.skills_targeted.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] text-amber"
                  >
                    {display(s)}
                  </span>
                ))}
              </div>
              {expanded === q.quest_id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 border-t border-edge pt-3"
                >
                  {q.mentor_line && (
                    <p className="text-sm font-semibold text-primary">
                      {q.mentor_line}
                    </p>
                  )}
                  {q.feedback && (
                    <p className="mt-1 text-xs text-muted">{q.feedback}</p>
                  )}
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {["all", "TECHNICAL", "CREATIVE", "ANALYTICAL", "SOCIAL", "STRATEGIC"].map(
              (d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d)}
                  className={`rounded-full px-3 py-1 text-[11px] capitalize transition-colors ${
                    domainFilter === d
                      ? "bg-amber text-black"
                      : "border border-edge text-muted"
                  }`}
                >
                  {d === "all" ? "All" : d.toLowerCase()}
                </button>
              )
            )}
          </div>
          <p className="mt-4 text-[11px] text-dim">
            Top responses this week — anonymized. Inspiration, not comparison.
          </p>
          <div className="mt-3 space-y-3">
            {community.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-edge bg-surface p-4"
              >
                <span className="text-[10px] tracking-widest text-muted">
                  {c.domain}
                </span>
                <p className="mt-2 text-sm italic leading-relaxed text-primary/90">
                  &ldquo;{c.excerpt}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </>
      )}
      <BottomNav />
    </main>
  );
}
