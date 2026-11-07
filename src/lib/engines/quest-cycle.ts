import type {Grade,Memory,Profile,Quest,QuestHistoryEntry,QuestType} from "../types";

/** Engine 2 policy. These are gameplay cycles, never narrative chapters. */
/** Concept coverage, not a count of days or quests. */
export const MISSION_QUEST_REQUIREMENT = 3;
export const MISSION_POLICY_VERSION = 2;
export function dailyQuestAttempt(profile:Pick<Profile,"quest_history"|"memory">,day:string):number{
 const completed=new Set(profile.quest_history.filter(q=>q.quest_type!=="mission"&&q.completed_at.slice(0,10)===day).map(q=>q.quest_id));
 const skipped=new Set(profile.memory.milestones.filter(m=>m.type==="quest_skipped"&&m.date.slice(0,10)===day).map(m=>m.quest_id));
 return new Set([...completed,...skipped]).size;
}
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
  readyChecks:number; topics:string[];
}

/** Read-only replay of legacy history; never changes XP or manufactures missions.
 * Production reward authority must come from stored outcomes and a transaction,
 * not a caller's copy of this projection. See ENGINE_AUDIT.md.
 */
export function missionProgress(profile:Pick<Profile,"quest_history">&{memory?:Pick<Memory,"milestones">},activeQuest:Quest|null=null):MissionProgress {
  let credits=0, completedMissions=0, attempts=0, awaitingRetry=false;
  let lastCompletedMissionId:string|null=null;
  let topics=new Set<string>();
  let checks:boolean[]=[];
  const seen=new Set<string>();
  const history=[...profile.quest_history].sort((a,b)=>a.completed_at.localeCompare(b.completed_at));
  for(const entry of history){
    if(!entry.quest_id||seen.has(entry.quest_id))continue;
    seen.add(entry.quest_id);
    if(qualifiesForMission(entry)){
      credits++;
      if(entry.learning_topics?.length){
        const understood=entry.grade==="Good"||entry.grade==="Excellent";
        checks.push(understood);checks=checks.slice(-3);
        if(understood)for(const topic of entry.learning_topics)topics.add(topic);
      }
    }else if(entry.quest_type!=="mission"&&entry.learning_topics?.length)checks.push(false);
    if(entry.quest_type!=="mission")continue;
    if(isSuccessfulChallenge(entry)){
      // A legacy streak mission may precede seven credits. No debt or lost XP.
      credits=0;topics=new Set();checks=[];
      completedMissions++;attempts=0;awaitingRetry=false;lastCompletedMissionId=entry.quest_id;
    }else{attempts++;awaitingRetry=true;}
  }
  const skipped=new Set((profile.memory?.milestones??[]).filter(m=>m.type==="mission_skipped"&&m.cycle===completedMissions+1&&typeof m.quest_id==="string").map(m=>m.quest_id));
  if(skipped.size){attempts+=skipped.size;awaitingRetry=true;}
  const active=activeQuest?.type==="mission"&&activeQuest.status==="active"&&!seen.has(activeQuest.id)?activeQuest:null;
  const readyChecks=checks.slice(-3).filter(Boolean).length;
  const ready=topics.size>=MISSION_QUEST_REQUIREMENT&&readyChecks>=2&&checks.at(-1)===true;
  const eligible=ready||awaitingRetry||!!active;
  let status:MissionStatus=eligible?(awaitingRetry?"awaiting_retry":"eligible"):credits?"progressing":lastCompletedMissionId?"completed":"not_eligible";
  if(active){
    const draft=active.draft;
    status=draft&&(draft.response.trim()||draft.step_responses.some(r=>r.trim())||draft.current_step>0)?"in_progress":"available";
  }
  return {policyVersion:MISSION_POLICY_VERSION,cycle:completedMissions+1,credits,progress:Math.min(MISSION_QUEST_REQUIREMENT,topics.size),banked:0,completedMissions,attempts,eligible,status,activeQuestId:active?.id??null,lastCompletedMissionId,readyChecks,topics:[...topics]};
}

/** Stable UUID for the same user/cycle/attempt. Use insert-if-absent persistence. */
export async function plannedQuestId(userId:string,type:QuestType,cycle:number,attempt:number,date:string):Promise<string>{
  const key=type==="mission"?`zynth:mission:${userId}:${cycle}:${attempt}`:`zynth:daily:${userId}:${date}:${attempt}`;
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key))).slice(0,16);
  digest[6]=(digest[6]&15)|80;digest[8]=(digest[8]&63)|128;
  const hex=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
