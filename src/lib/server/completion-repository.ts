import type {SupabaseClient} from "@supabase/supabase-js";
import type {Profile,Quest} from "../types";
import {RevisionConflict,type CommittedResult,type CompletionRepository,type CompletionResponse} from "./complete-quest";

/** Construct only inside a server route with a secret service client. */
export function completionRepository(client:SupabaseClient):CompletionRepository {
 return {
   profile:async owner=>{const {data,error}=await client.from("profiles").select("*").eq("user_id",owner).maybeSingle();if(error)throw error;return data as Profile|null;},
   quest:async(owner,id)=>{const {data,error}=await client.from("quests").select("*").eq("user_id",owner).eq("id",id).maybeSingle();if(error)throw error;return data?{...data.quest_data,id:data.id,status:data.status,created_at:data.created_at} as Quest:null;},
   outcome:async(owner,id)=>{const {data,error}=await client.from("quest_outcomes").select("result").eq("user_id",owner).eq("quest_id",id).maybeSingle();if(error)throw error;return data?.result as CommittedResult??null;},
   claim:async(owner,id,lease)=>{const {data,error}=await client.rpc("claim_quest_submission",{p_user_id:owner,p_quest_id:id,p_lease_id:lease});if(error)throw error;return data===true;},
   release:async(owner,id,lease)=>{const {error}=await client.rpc("release_quest_submission",{p_user_id:owner,p_quest_id:id,p_lease_id:lease});if(error)throw error;},
   commit:async(owner,id,revision,profile,result)=>{
     const {data,error}=await client.rpc("commit_quest_result",{p_user_id:owner,p_quest_id:id,p_expected_revision:revision,p_profile:profile,p_result:result});
     if(error){if(error.code==="40001")throw new RevisionConflict();throw error;}return data as CompletionResponse;
   },
 };
}
