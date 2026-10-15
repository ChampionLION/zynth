import type { OnboardingAnswers, Profile, Quest } from "./types";

export interface AccountUser { id: string; email: string; name: string }
export interface OnboardingDraft {
  version: 2;
  goal: string;
  answers: Partial<OnboardingAnswers>;
  step: number;
  updated_at: string;
}
export interface QuestDraft {
  response: string;
  step_responses: string[];
  current_step: number;
  elapsed_seconds: number;
  updated_at: string;
}

export function resumePath(profile: Profile | null, quest: Quest | null, today = new Date().toISOString().slice(0,10)): string {
  if (!profile) return "/onboarding";
  if (quest?.status === "active" && quest.date === today && quest.draft) return "/quest";
  return "/dashboard";
}
export function parseOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as OnboardingDraft;
  if (d.version !== 2 || typeof d.goal !== "string" || d.goal.length > 120 || !Number.isInteger(d.step) || d.step < 0 || d.step > 4 || !d.answers || typeof d.answers !== "object" || typeof d.updated_at !== "string" || !Number.isFinite(Date.parse(d.updated_at))) return null;
  const allowed: Record<string, string[]> = { Q2:["A","B","C","D","E"], Q3:["A","B","C","D"], Q4:["A","B","C","D","E"], Q5:["A","B","C","D","E"] };
  const answers: Partial<OnboardingAnswers> = {};
  for (const [key, options] of Object.entries(d.answers)) {
    if (key === "Q1") continue;
    if (!allowed[key] || !Array.isArray(options) || options.length > 2 || new Set(options).size !== options.length || options.some(o=>typeof o !== "string" || !allowed[key].includes(o))) return null;
    answers[key as keyof OnboardingAnswers] = options;
  }
  return { version:2, goal:d.goal, answers, step:d.step, updated_at:d.updated_at };
}
export function parseQuestDraft(value: unknown, steps: number): QuestDraft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as QuestDraft;
  if (typeof d.response !== "string" || d.response.length > 24000 || !Array.isArray(d.step_responses) || d.step_responses.some(r=>typeof r !== "string" || r.length > 24000) || !Number.isInteger(d.current_step) || d.current_step < 0 || d.current_step >= Math.max(1,steps) || d.step_responses.length !== d.current_step || !Number.isFinite(d.elapsed_seconds) || d.elapsed_seconds < 0 || typeof d.updated_at !== "string" || !Number.isFinite(Date.parse(d.updated_at))) return null;
  return d;
}
export function newestDraft<T extends {updated_at:string}>(remote: T | null, local: T | null): T | null {
  if (!remote) return local;
  if (!local) return remote;
  return Date.parse(local.updated_at) > Date.parse(remote.updated_at) ? local : remote;
}
