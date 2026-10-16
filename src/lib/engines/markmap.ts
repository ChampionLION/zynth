import type { Profile, QuestHistoryEntry } from "../types";
import { todayStr } from "./quest";
import {missionProgress} from "./quest-cycle";

/** Rendering segments are not narrative chapters. Alias retained for old clients. */
export const MARKS_PER_SEGMENT = 14;
export const MARKS_PER_CHAPTER = MARKS_PER_SEGMENT;
export const WORLD_POINTS = [
  [115, 470], [170, 350], [260, 395], [335, 295], [425, 365], [490, 255], [595, 315],
  [695, 205], [795, 265], [895, 185], [1005, 265], [1050, 385], [945, 460], [835, 510],
] as const;
export type MarkState = "completed" | "current" | "future" | "tomorrow";
export interface WorldMark {
  number: number;
  x: number;
  y: number;
  state: MarkState;
  isMission: boolean;
  entry: QuestHistoryEntry | null;
  exp: number;
}

/** A Mark represents a successful quest day, not every attempt or retry. */
export function completedMarks(profile: Profile): { entry: QuestHistoryEntry; exp: number }[] {
  const days = new Map<string, { entry: QuestHistoryEntry; exp: number }>();
  for (const entry of [...profile.quest_history].sort((a,b)=>a.completed_at.localeCompare(b.completed_at))) {
    if (entry.grade === "Fail") continue;
    const day = entry.completed_at.slice(0,10);
    const existing = days.get(day);
    days.set(day, {entry, exp:(existing?.exp ?? 0)+entry.exp_earned});
  }
  return [...days.values()];
}

export function activeWorldSegment(profile: Profile): number {
  return Math.floor(completedMarks(profile).length / MARKS_PER_CHAPTER);
}
/** @deprecated This is a visual segment, not a narrative chapter. */
export const activeWorldChapter=activeWorldSegment;

export function buildWorldMarks(profile: Profile, chapter = activeWorldChapter(profile), today = todayStr()): WorldMark[] {
  const marks = completedMarks(profile);
  const dayDone = profile.last_quest_date === today;
  const missionDue=missionProgress(profile).eligible;
  const safeChapter = Math.max(0, Math.floor(chapter));
  return WORLD_POINTS.map(([x,y], index) => {
    const overall = safeChapter * MARKS_PER_CHAPTER + index;
    const completed = marks[overall];
    return {
      number: overall + 1, x, y,
      state: completed ? "completed" : overall === marks.length ? dayDone&&!missionDue ? "tomorrow" : "current" : "future",
      isMission: completed?.entry.quest_type === "mission" || (overall===marks.length&&missionDue),
      entry: completed?.entry ?? null,
      exp: completed?.exp ?? 0,
    };
  });
}

export function worldRouteSegment(from: WorldMark, to: WorldMark): string {
  const dx = (to.x - from.x) * .45;
  const bend = (to.y - from.y) * .18;
  return `M ${from.x} ${from.y} C ${from.x+dx} ${from.y-bend}, ${to.x-dx} ${to.y+bend}, ${to.x} ${to.y}`;
}
