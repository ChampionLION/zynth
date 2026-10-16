import {z} from "zod";
import type {DailyQuestion,Profile,Quest,ZynthEvent} from "./types";
import type {CommittedResult} from "./server/complete-quest";
const answers=z.object({Q1:z.array(z.string().max(120)).length(1),Q2:z.array(z.string()).min(1).max(2),Q3:z.array(z.string()).min(1).max(2),Q4:z.array(z.string()).min(1).max(2),Q5:z.array(z.string()).min(1).max(2)}).strict();
export const JourneyActionInput=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("onboard"),answers}).strict(),
 z.object({kind:z.literal("generate")}).strict(),
 z.object({kind:z.literal("energy"),energy:z.enum(["high","mid","low"])}).strict(),
 z.object({kind:z.literal("daily_question")}).strict(),
 z.object({kind:z.literal("answer_daily"),answer:z.string().max(8).nullable()}).strict(),
 z.object({kind:z.literal("skip"),questId:z.string().uuid()}).strict(),
 z.object({kind:z.literal("prestige"),requestId:z.string().uuid()}).strict(),
 z.object({kind:z.literal("profession"),requestId:z.string().uuid()}).strict(),
 z.object({kind:z.literal("economy"),questId:z.string().uuid(),effect:z.enum(["reduce_difficulty","hint_upgrade"])}).strict(),
 z.object({kind:z.literal("legacy_archive"),snapshot:z.object({profile:z.record(z.string(),z.unknown()),quest:z.unknown().optional()}).strict()}).strict(),
]);
export type JourneyAction=z.infer<typeof JourneyActionInput>;
export interface JourneyActionResult {profile:Profile|null;quest:Quest|null;question?:DailyQuestion|null;replayed?:boolean}
export interface PendingOutcome {questId:string;result:CommittedResult;gradeSeen:boolean;eventCursor:number}
export interface JourneyState {mode:"legacy"|"trusted";profile?:Profile|null;activeQuest?:Quest|null;pending?:PendingOutcome|null}
export interface OutcomePresentation {gradeResult:CommittedResult["gradeResult"];expEarned:number;streakMultiplier:number;changedStats:string[]}
export function outcomePresentation(pending:PendingOutcome):{gradeReveal:OutcomePresentation|null;events:ZynthEvent[]}{
 const r=pending.result;return {gradeReveal:pending.gradeSeen?null:{gradeResult:r.gradeResult,expEarned:r.expEarned,streakMultiplier:r.streakMultiplier,changedStats:r.changedStats},events:r.events.slice(pending.eventCursor)};
}
