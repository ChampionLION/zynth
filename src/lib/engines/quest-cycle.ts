import type {Grade,Memory,Profile,Quest,QuestHistoryEntry,QuestType} from "../types";

/** Engine 2 policy. These are gameplay cycles, never narrative chapters. */
export const MISSION_QUEST_REQUIREMENT = 7;
export const MISSION_POLICY_VERSION = 1;
const eligibleTypes = new Set<QuestType>(["calibration","daily","challenge","hidden","weakness","prestige"]);
const passingGrades = new Set<Grade>(["Basic","Good","Excellent"]);
export function isSuccessfulChallenge(entry: Pick<QuestHistoryEntry,"grade">): boolean {
  return passingGrades.has(entry.grade);
}
export function qualifiesForMission(entry: QuestHistoryEntry): boolean {
  return eligibleTypes.has(entry.quest_type) && isSuccessfulChallenge(entry) && !entry.swift_mode_used && !entry.retest_of;
}
export type MissionStatus = "not_eligible"|"progressing"|"eligible"|"generated"|"available"|"in_progress"|"awaiting_retry"|"completed";
export interface MissionProgress {
  policyVersion:number; cycle:number; credits:number; progress:number; banked:number;
  completedMissions:number; attempts:number; eligible:boolean; status:MissionStatus;
  activeQuestId:string|null; lastCompletedMissionId:string|null;
}

/** Read-only replay of legacy history; never changes XP or manufactures missions.
 * Production reward authority must come from stored outcomes and a transaction,
 * not a caller's copy of this projection. See ENGINE_AUDIT.md.
 */
export function missionProgress(profile:Pick<Profile,"quest_history">&{memory?:Pick<Memory,"milestones">},activeQuest:Quest|null=null):MissionProgress {
  let credits=0, completedMissions=0, attempts=0, awaitingRetry=false;
  let lastCompletedMissionId:string|null=null;
  const seen=new Set<string>();
  const history=[...profile.quest_history].sort((a,b)=>a.completed_at.localeCompare(b.completed_at));
  for(const entry of history){
    if(!entry.quest_id||seen.has(entry.quest_id))continue;
    seen.add(entry.quest_id);
    if(qualifiesForMission(entry))credits++;
    if(entry.quest_type!=="mission")continue;
    if(isSuccessfulChallenge(entry)){
      // A legacy streak mission may precede seven credits. No debt or lost XP.
      credits=Math.max(0,credits-MISSION_QUEST_REQUIREMENT);
      completedMissions++;attempts=0;awaitingRetry=false;lastCompletedMissionId=entry.quest_id;
    }else{attempts++;awaitingRetry=true;}
  }
  const skipped=new Set((profile.memory?.milestones??[]).filter(m=>m.type==="mission_skipped"&&m.cycle===completedMissions+1&&typeof m.quest_id==="string").map(m=>m.quest_id));
  if(skipped.size){attempts+=skipped.size;awaitingRetry=true;}
  const active=activeQuest?.type==="mission"&&activeQuest.status==="active"&&!seen.has(activeQuest.id)?activeQuest:null;
  const eligible=credits>=MISSION_QUEST_REQUIREMENT||awaitingRetry||!!active;
  let status:MissionStatus=eligible?(awaitingRetry?"awaiting_retry":"eligible"):credits?"progressing":lastCompletedMissionId?"completed":"not_eligible";
  if(active){
    const draft=active.draft;
    status=draft&&(draft.response.trim()||draft.step_responses.some(r=>r.trim())||draft.current_step>0)?"in_progress":"available";
  }
  return {policyVersion:MISSION_POLICY_VERSION,cycle:completedMissions+1,credits,progress:Math.min(7,credits),banked:Math.max(0,credits-7),completedMissions,attempts,eligible,status,activeQuestId:active?.id??null,lastCompletedMissionId};
}

/** Stable UUID for the same user/cycle/attempt. Use insert-if-absent persistence. */
export async function plannedQuestId(userId:string,type:QuestType,cycle:number,attempt:number,date:string):Promise<string>{
  const key=type==="mission"?`zynth:mission:${userId}:${cycle}:${attempt}`:`zynth:daily:${userId}:${date}:${attempt}`;
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key))).slice(0,16);
  digest[6]=(digest[6]&15)|80;digest[8]=(digest[8]&63)|128;
  const hex=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
