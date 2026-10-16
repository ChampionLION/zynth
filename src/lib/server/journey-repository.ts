import type {SupabaseClient} from "@supabase/supabase-js";
import type {Profile,Quest} from "../types";
import {missionProgress} from "../engines/quest-cycle";
import {RevisionConflict} from "./complete-quest";
import type {ActionClaim,JourneyRepository} from "./journey-actions";
import type {JourneyActionResult,PendingOutcome} from "../journey-contract";
export function storedQuest(row:Record<string,unknown>|null):Quest|null{return row?{...(row.quest_data as Quest),id:row.id as string,status:row.status as Quest["status"],created_at:row.created_at as string,draft:row.draft_data as Quest["draft"]}:null;}
export function journeyRepository(client:SupabaseClient):JourneyRepository{
 const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await client.rpc(name,args);if(error){if(error.code==="40001")throw new RevisionConflict();throw error;}return data;};
 return {
  profile:async owner=>{const {data,error}=await client.from("profiles").select("*").eq("user_id",owner).maybeSingle();if(error)throw error;return data as Profile|null;},
  activeQuest:async owner=>{const {data,error}=await client.from("quests").select("*").eq("user_id",owner).eq("status","active").order("created_at",{ascending:false}).order("id").limit(1).maybeSingle();if(error)throw error;return storedQuest(data);},
  quest:async(owner,id)=>{const {data,error}=await client.from("quests").select("*").eq("user_id",owner).eq("id",id).maybeSingle();if(error)throw error;return storedQuest(data);},
  action:async(owner,key)=>{const {data,error}=await client.from("journey_actions").select("result").eq("user_id",owner).eq("action_key",key).maybeSingle();if(error)throw error;return data?.result as JourneyActionResult??null;},
  claim:async(owner,key,kind,input,plan,lease)=>await rpc("claim_journey_action",{p_user_id:owner,p_key:key,p_kind:kind,p_input:input,p_plan:plan,p_lease:lease}) as ActionClaim,
  release:async(owner,key,lease)=>{await rpc("release_journey_action",{p_user_id:owner,p_key:key,p_lease:lease});},
  commit:async(owner,key,lease,revision,profile,quest,extra)=>await rpc("commit_journey_action",{p_user_id:owner,p_key:key,p_lease:lease,p_revision:revision,p_profile:profile,p_quest:quest,p_extra:extra,p_mission:profile?missionProgress(profile,quest):null}) as JourneyActionResult,
  rank:async owner=>await rpc("trusted_profession_rank",{p_user_id:owner}) as {rank:number;total:number},
  verifiedCredits:async owner=>await rpc("verified_mission_credits",{p_user_id:owner}) as number,
 };
}
export async function pendingOutcome(client:SupabaseClient,owner:string):Promise<PendingOutcome|null>{
 // The SQL helper filters before LIMIT, so an acknowledged old outcome cannot
 // hide a later pending presentation. Reads are always scoped to verified owner.
 const {data,error}=await client.rpc("pending_journey_outcome",{p_user_id:owner});if(error)throw error;return data as PendingOutcome|null;
}
