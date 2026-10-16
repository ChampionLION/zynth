import type { Profile, Quest } from "./types";
import type { AccountUser, OnboardingDraft, QuestDraft } from "./account-flow";
import { newestDraft, parseOnboardingDraft, parseQuestDraft } from "./account-flow";
import { isSupabaseConfigured, supabase } from "./supabase";
import {EditableProfileSchema,type EditableProfile} from "./appearance";
import {readJourneyState,trustedJourney,sendJourneyAction,journeyRequest} from "./journey-client";
import type {PendingOutcome} from "./journey-contract";
export { supabase };
/** Data sync is independent of the model provider's mock/live setting. */
export const isLive = isSupabaseConfigured;
const LS_PROFILE="zynth_profile", LS_QUEST="zynth_active_quest", LS_USER="zynth_user", LS_ACCOUNT="zynth_account";

function readLocal(key:string): unknown {
  if (typeof window === "undefined") return null;
  try { const value=localStorage.getItem(key); return value ? JSON.parse(value) : null; } catch { return null; }
}
function writeLocal(key:string,value:unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key,JSON.stringify(value)); } catch { /* Cloud saves still work when browser storage is unavailable. */ }
}
function profileFromRow(row:Record<string,unknown>): Profile {
  const { id, ...profile }=row;
  void id;
  return profile as unknown as Profile;
}
export async function loadProfile(userId:string): Promise<Profile|null> {
  if (isLive()) {
    const {data,error}=await supabase().from("profiles").select("*").eq("user_id",userId).maybeSingle();
    if(error) throw error;
    return data ? profileFromRow(data) : null;
  }
  const profile=readLocal(LS_PROFILE) as Profile|null;
  return profile?.user_id===userId ? profile : null;
}
export async function saveProfile(profile:Profile):Promise<void> {
  if(trustedJourney(profile.user_id))throw new Error("Progress updates must be saved through your journey.");
  const row={...profile,updated_at:new Date().toISOString()};
  if(isLive()) {
    const {error}=await supabase().from("profiles").upsert(row,{onConflict:"user_id"});
    if(error)throw error;
  } else writeLocal(LS_PROFILE,row);
}
/** Settings patch only editable fields, preserving concurrently earned progress. */
export async function saveEditableProfile(userId:string,input:EditableProfile):Promise<EditableProfile>{
 const clean=EditableProfileSchema.parse(input);
 if(isLive()){
   const {data,error}=await supabase().from("profiles").update({...clean,updated_at:new Date().toISOString()}).eq("user_id",userId).select("display_name,character_name,leaderboard_opt_out").single();
   if(error)throw error;if(!data)throw new Error("Your profile could not be updated.");return EditableProfileSchema.parse(data);
 }
 const current=await loadProfile(userId);if(!current)throw new Error("Please sign in again.");await saveProfile({...current,...clean});return clean;
}
export async function loadActiveQuest(userId:string):Promise<Quest|null> {
  if(isLive()) {
    const {data,error}=await supabase().from("quests").select("*").eq("user_id",userId).eq("status","active").order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;
    if(!data)return null;
    const quest={...data.quest_data,id:data.id,status:data.status} as Quest;
    quest.draft=newestDraft(parseQuestDraft(data.draft_data,quest.steps.length),readQuestDraft(userId,quest));
    return quest;
  }
  const quest=readLocal(LS_QUEST) as Quest|null;
  if(quest)quest.draft=newestDraft(quest.draft??null,readQuestDraft(userId,quest));
  return quest;
}
export async function saveActiveQuest(userId:string,quest:Quest|null):Promise<void> {
  if(trustedJourney(userId))throw new Error("Challenges must be prepared through your journey.");
  if(isLive()) {
    if(!quest){
      const {error}=await supabase().from("quests").update({status:"completed",completed_at:new Date().toISOString()}).eq("user_id",userId).eq("status","active");
      if(error)throw error;
      return;
    }
    const {error}=await supabase().from("quests").upsert({id:quest.id,user_id:userId,quest_data:quest,quest_type:quest.type,difficulty:quest.difficulty,status:quest.status,is_multi_step:quest.steps.length>0,steps:quest.steps,created_at:quest.created_at,draft_data:quest.draft??null});
    if(error)throw error;
    const {error:retireError}=await supabase().from("quests").update({status:"expired"}).eq("user_id",userId).eq("status","active").neq("id",quest.id);
    if(retireError)throw retireError;
    return;
  }
  if(quest)writeLocal(LS_QUEST,quest);else localStorage.removeItem(LS_QUEST);
}
export async function retireQuest(userId:string,questId:string,status:"completed"|"skipped"):Promise<void>{
 if(trustedJourney(userId))throw new Error("Challenges must be resolved through your journey.");
 if(isLive()){
   const {error}=await supabase().from("quests").update({status,completed_at:status==="completed"?new Date().toISOString():null}).eq("user_id",userId).eq("id",questId).eq("status","active");if(error)throw error;
 }else{const current=readLocal(LS_QUEST) as Quest|null;if(current?.id===questId)localStorage.removeItem(LS_QUEST);}
}

/** Repeated generation for a stable plan must not overwrite an existing draft. */
export async function ensurePlannedQuest(userId:string,quest:Quest):Promise<Quest>{
  if(trustedJourney(userId))throw new Error("Challenges must be prepared through your journey.");
  if(!isLive()){
    const existing=readLocal(LS_QUEST) as Quest|null;
    if(existing?.id===quest.id)return existing;
    await saveActiveQuest(userId,quest);return quest;
  }
  const {data,error}=await supabase().from("quests").upsert({id:quest.id,user_id:userId,quest_data:quest,quest_type:quest.type,difficulty:quest.difficulty,status:"active",is_multi_step:quest.steps.length>0,steps:quest.steps,created_at:quest.created_at},{onConflict:"id",ignoreDuplicates:true}).select("*");
  if(error)throw error;
  const row=data?.[0]??(await supabase().from("quests").select("*").eq("id",quest.id).eq("user_id",userId).single()).data;
  if(!row||row.status!=="active")throw new Error("This challenge has already been resolved. Refresh your journey.");
  const result={...row.quest_data,id:row.id,status:row.status} as Quest;
  result.draft=newestDraft(parseQuestDraft(row.draft_data,result.steps.length),readQuestDraft(userId,result));
  return result;
}

/** Only a verified account with the same email can import this browser's old local journey. */
export async function loadAccountJourney(user:AccountUser):Promise<{profile:Profile|null;activeQuest:Quest|null;mode:"legacy"|"trusted";pendingOutcome:PendingOutcome|null}> {
  const state=await readJourneyState(user.id);
  if(state.mode==="trusted"){
    const profile=state.profile??null,activeQuest=state.activeQuest??null;
    if(!profile){
      const legacy=(readLocal(LS_ACCOUNT)??readLocal(LS_USER)) as {id?:string;email?:string}|null;
      const candidate=readLocal(LS_PROFILE) as Profile|null;
      if(legacy?.id&&legacy.email?.toLowerCase()===user.email.toLowerCase()&&candidate?.user_id===legacy.id){
        const snapshot={profile:candidate as unknown as Record<string,unknown>,quest:readLocal(LS_QUEST)};
        // Oversize backups remain intact in the original browser. Never import
        // claimed XP into the authoritative profile or promote legacy evidence.
        if(new TextEncoder().encode(JSON.stringify(snapshot)).length<280000)await sendJourneyAction(user.id,{kind:"legacy_archive",snapshot});
      }
    }
    if(activeQuest)activeQuest.draft=newestDraft(parseQuestDraft(activeQuest.draft,activeQuest.steps.length),readQuestDraft(user.id,activeQuest));
    return {profile,activeQuest,mode:"trusted",pendingOutcome:state.pending??null};
  }
  let profile=await loadProfile(user.id);
  if(!profile && isLive()) {
    const legacy=(readLocal(LS_ACCOUNT)??readLocal(LS_USER)) as {id?:string;email?:string}|null;
    const candidate=readLocal(LS_PROFILE) as Profile|null;
    if(legacy?.id && legacy.email?.toLowerCase()===user.email.toLowerCase() && candidate?.user_id===legacy.id && Array.isArray(candidate.quest_history) && Array.isArray(candidate.skills) && candidate.memory && candidate.stats) {
      const imported={...candidate,user_id:user.id,display_name:user.name,updated_at:new Date().toISOString()};
      const {data,error}=await supabase().from("profiles").upsert(imported,{onConflict:"user_id",ignoreDuplicates:true}).select("user_id");
      if(error)throw error;
      if(data?.length) {
        const localQuest=readLocal(LS_QUEST) as Quest|null;
        if(localQuest?.status==="active" && !candidate.quest_history.some(q=>q.quest_id===localQuest.id)) await saveActiveQuest(user.id,localQuest);
      }
      profile=await loadProfile(user.id);
    }
  }
  let activeQuest=profile ? await loadActiveQuest(user.id) : null;
  if(activeQuest && profile?.quest_history.some(q=>q.quest_id===activeQuest!.id))activeQuest=null;
  return {profile,activeQuest,mode:"legacy",pendingOutcome:null};
}

const onboardingKey=(userId:string)=>`zynth:onboarding:${userId}`;
export function cacheOnboardingDraft(userId:string,draft:OnboardingDraft):void { writeLocal(onboardingKey(userId),draft); }
export async function loadOnboardingDraft(userId:string):Promise<OnboardingDraft|null> {
  const local=parseOnboardingDraft(readLocal(onboardingKey(userId)));
  if(!isLive())return local;
  const {data,error}=await supabase().from("onboarding_drafts").select("draft_data").eq("user_id",userId).maybeSingle();
  if(error)throw error;
  return newestDraft(parseOnboardingDraft(data?.draft_data),local);
}
export async function saveOnboardingDraft(userId:string,draft:OnboardingDraft):Promise<void> {
  cacheOnboardingDraft(userId,draft);
  if(!isLive())return;
  const {error}=await supabase().from("onboarding_drafts").upsert({user_id:userId,draft_data:draft,updated_at:draft.updated_at},{onConflict:"user_id"});
  if(error)throw error;
}
export async function clearOnboardingDraft(userId:string):Promise<void> {
  localStorage.removeItem(onboardingKey(userId));
  if(isLive()) {
    const {error}=await supabase().from("onboarding_drafts").delete().eq("user_id",userId);
    if(error)throw error;
  }
}
const questKey=(userId:string,questId:string)=>`zynth:quest:${userId}:${questId}`;
export function readQuestDraft(userId:string,quest:Quest):QuestDraft|null { return parseQuestDraft(readLocal(questKey(userId,quest.id)),quest.steps.length); }
export function cacheQuestDraft(userId:string,questId:string,draft:QuestDraft):void { writeLocal(questKey(userId,questId),draft); }
export async function saveQuestDraft(userId:string,questId:string,draft:QuestDraft):Promise<void> {
  cacheQuestDraft(userId,questId,draft);
  if(isLive()) {
    const {error}=await supabase().from("quests").update({draft_data:draft}).eq("user_id",userId).eq("id",questId).eq("status","active");
    if(error)throw error;
  }
}
export function clearQuestDraft(userId:string,questId:string):void { localStorage.removeItem(questKey(userId,questId)); }
const resetRequests=new Map<string,string>();
export async function eraseProgress(user:AccountUser):Promise<void> {
  if(!isLive())throw new Error("Account access is not connected.");
  if(trustedJourney(user.id)){
    const key=`zynth:reset:${user.id}`;
    let requestId=resetRequests.get(user.id);
    try{requestId??=localStorage.getItem(key)??undefined;}catch{/* The in-memory receipt still prevents repeat requests. */}
    requestId??=crypto.randomUUID();resetRequests.set(user.id,requestId);try{localStorage.setItem(key,requestId);}catch{/* Account storage may be disabled. */}
    await journeyRequest(user.id,"reset",{confirmation:"reset-my-progress",requestId});
    resetRequests.delete(user.id);try{localStorage.removeItem(key);}catch{/* Reset is already committed. */}
  }
  else {
  for(const table of ["quests","onboarding_drafts","profiles"]) {
    const {error}=await supabase().from(table).delete().eq("user_id",user.id);
    if(error)throw error;
  }
  }
  for(const key of Object.keys(localStorage))if(key.startsWith(`zynth:quest:${user.id}:`)||key===onboardingKey(user.id))localStorage.removeItem(key);
  const legacy=(readLocal(LS_ACCOUNT)??readLocal(LS_USER)) as {email?:string}|null;
  if(legacy?.email?.toLowerCase()===user.email.toLowerCase())for(const key of [LS_USER,LS_ACCOUNT,LS_PROFILE,LS_QUEST])localStorage.removeItem(key);
}
