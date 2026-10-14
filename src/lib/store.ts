// ─── Global state (Zustand) ──────────────────────────────────────

"use client";

import { create } from "zustand";
import type { Profile, Quest, ZynthEvent, GradeResult } from "./types";
import { loadProfile, saveProfile, loadActiveQuest, saveActiveQuest, getLocalUser } from "./db";
import type { PipelineResult } from "./engines/pipeline";

interface GradeRevealData {
  gradeResult: GradeResult;
  expEarned: number;
  streakMultiplier: number;
  changedStats: string[];
}

interface ZynthStore {
  profile: Profile | null;
  activeQuest: Quest | null;
  eventQueue: ZynthEvent[];
  gradeReveal: GradeRevealData | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setProfile: (p: Profile) => Promise<void>;
  setActiveQuest: (q: Quest | null) => Promise<void>;
  applyPipelineResult: (r: PipelineResult, reveal: GradeRevealData) => Promise<void>;
  shiftEvent: () => ZynthEvent | undefined;
  clearGradeReveal: () => void;
  reset: () => void;
}

export const useZynth = create<ZynthStore>((set, get) => ({
  profile: null,
  activeQuest: null,
  eventQueue: [],
  gradeReveal: null,
  hydrated: false,

  hydrate: async () => {
    const user = getLocalUser();
    if (!user) {
      set({ hydrated: true });
      return;
    }
    const profile = await loadProfile(user.id);
    let activeQuest = profile ? await loadActiveQuest(user.id) : null;
    if (activeQuest && profile?.quest_history.some(q=>q.quest_id===activeQuest!.id)) activeQuest=null;
    set({ profile, activeQuest, hydrated: true });
  },

  setProfile: async (p) => {
    await saveProfile(p);
    set({ profile: p });
  },

  setActiveQuest: async (q) => {
    const user = getLocalUser();
    if (user) await saveActiveQuest(user.id, q);
    set({ activeQuest: q });
  },

  applyPipelineResult: async (r, reveal) => {
    await saveProfile(r.profile);
    set({
      profile: r.profile,
      eventQueue: [...get().eventQueue, ...r.events],
      gradeReveal: reveal,
      activeQuest: null,
    });
    const user = getLocalUser();
    if (user) { try { await saveActiveQuest(user.id, null); } catch { /* Profile is committed; hydration ignores graded quests. */ } }
  },

  shiftEvent: () => {
    const [head, ...rest] = get().eventQueue;
    set({ eventQueue: rest });
    return head;
  },

  clearGradeReveal: () => set({ gradeReveal: null }),

  reset: () =>
    set({
      profile: null,
      activeQuest: null,
      eventQueue: [],
      gradeReveal: null,
    }),
}));
