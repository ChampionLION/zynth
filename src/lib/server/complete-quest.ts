import {z} from "zod";
import type {GradeResult,Profile,Quest,ZynthEvent} from "../types";
import {runExploitCheck,recordExploitFlag} from "../engines/exploit";
import {runPostGradePipeline} from "../engines/pipeline";
import {mockBehaviorSummary,mockDiscoveryMessage,mockEvolveSkillName} from "../llm/mock";
import {GradeResultSchema} from "../llm/schemas";

export const CompletionInput=z.object({questId:z.string().uuid(),responseText:z.string().trim().min(1).max(24000)}).strict();
export interface CommittedResult {
 gradeResult:GradeResult;expEarned:number;streakMultiplier:number;changedStats:string[];events:ZynthEvent[];
}
export interface CompletionResponse {profile:Profile;result:CommittedResult;replayed:boolean}
export interface CompletionRepository {
 profile:(owner:string)=>Promise<Profile|null>;
 quest:(owner:string,id:string)=>Promise<Quest|null>;
 outcome:(owner:string,id:string)=>Promise<CommittedResult|null>;
 claim:(owner:string,id:string,lease:string)=>Promise<boolean>;
 release:(owner:string,id:string,lease:string)=>Promise<void>;
 commit:(owner:string,id:string,revision:number,profile:Profile,result:CommittedResult&{responseText:string})=>Promise<CompletionResponse>;
}
export class JourneyError extends Error {constructor(message:string,public status:number){super(message);}}
export class RevisionConflict extends Error {}
type Grader=(args:{profile:Profile;quest:Quest;response:string;responseTimeSeconds:number;strict:boolean})=>Promise<GradeResult>;

/** Trusted service boundary: takes a verified owner and a response, never client
 * grade, balances, profile, completion time or mission eligibility claims.
 */
export async function completeStoredQuest(owner:string,input:unknown,repo:CompletionRepository,grade:Grader):Promise<CompletionResponse>{
 const parsed=CompletionInput.safeParse(input);
 if(!parsed.success)throw new JourneyError("Enter a valid response for your challenge.",400);
 const {questId,responseText}=parsed.data;
 let profile=await repo.profile(owner);
 if(!profile||profile.user_id!==owner)throw new JourneyError("Your profile could not be found.",404);
 const prior=await repo.outcome(owner,questId);
 if(prior)return {profile,result:prior,replayed:true};
 if(profile.quest_history.some(q=>q.quest_id===questId))throw new JourneyError("This challenge is already recorded. Reopen your journey.",409);
 const quest=await repo.quest(owner,questId);
 if(!quest||quest.id!==questId||quest.status!=="active")throw new JourneyError("This challenge is not available.",404);
 if(quest.steps.length>0){
   const prefixes=quest.steps.map((step,i)=>`[Step ${i+1}: ${step.title}]`);
   const positions=prefixes.map(prefix=>responseText.indexOf(prefix));
   if(positions.some((position,i)=>position<0||(i>0&&position<=positions[i-1])||!responseText.slice(position+prefixes[i].length,positions[i+1]??responseText.length).trim()))throw new JourneyError("Complete every step before submitting your mission.",400);
 }
 const lease=crypto.randomUUID();
 if(!await repo.claim(owner,questId,lease))throw new JourneyError("Your response is already being evaluated. Please wait and try again.",409);
 try{
   let gradeResult:GradeResult|null=null;
   for(let attempt=0;attempt<3;attempt++){
     const duplicate=await repo.outcome(owner,questId);
     if(duplicate)return {profile:await repo.profile(owner)??profile,result:duplicate,replayed:true};
     // Issuance age is server-observed. Browser timers are never reward evidence.
     const age=(Date.now()-Date.parse(quest.created_at))/1000;
     if(!Number.isFinite(age)||age<0)throw new JourneyError("The challenge timing could not be verified.",409);
     const responseTimeSeconds=Math.floor(age);
     const exploit=runExploitCheck({profile,response:responseText,responseTimeSeconds});
     if(exploit.rejected)throw new JourneyError("That response needs a fresh angle. Your draft is still here.",422);
     gradeResult??=GradeResultSchema.parse(await grade({profile,quest,response:responseText,responseTimeSeconds,strict:exploit.strictGrader})) as GradeResult;
     const working=structuredClone(profile);recordExploitFlag(working,exploit);
     const result=await runPostGradePipeline({profile:working,quest,gradeResult,responseText,responseTimeSeconds,exploit,swiftModeUsed:false,enrichment:{
       skillName:async(oldName,_profile,tier)=>mockEvolveSkillName(oldName,tier),
       discoveryMessage:async(name,p)=>mockDiscoveryMessage(name,p.profession),
       behaviorSummary:async p=>p.behavior_summary_cache??mockBehaviorSummary(p),
     }});
     try{return await repo.commit(owner,questId,profile.progression_revision??0,result.profile,{gradeResult,expEarned:result.expEarned,streakMultiplier:result.streakMultiplier,changedStats:result.changedStats,events:result.events,responseText});}
     catch(error){
       if(!(error instanceof RevisionConflict)||attempt===2)throw error;
       const latest=await repo.profile(owner);if(!latest||latest.user_id!==owner)throw new JourneyError("Your profile changed. Reopen your journey.",409);profile=latest;
     }
   }
   throw new JourneyError("Your profile changed. Please retry your response.",409);
 }finally{
   // Lease expiry remains the recovery fallback when cleanup cannot reach DB.
   try{await repo.release(owner,questId,lease);}catch{/* Does not undo a committed result. */}
 }
}
