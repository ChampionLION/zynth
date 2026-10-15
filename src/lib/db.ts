import type { Profile, Quest } from "./types";
import type { AccountUser, OnboardingDraft, QuestDraft } from "./account-flow";
import { newestDraft, parseOnboardingDraft, parseQuestDraft } from "./account-flow";
import { isSupabaseConfigured, supabase } from "./supabase";
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
  const row={...profile,updated_at:new Date().toISOString()};
  if(isLive()) {
    const {error}=await supabase().from("profiles").upsert(row,{onConflict:"user_id"});
    if(error)throw error;
  } else writeLocal(LS_PROFILE,row);
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

/** Only a verified account with the same email can import this browser's old local journey. */
export async function loadAccountJourney(user:AccountUser):Promise<{profile:Profile|null;activeQuest:Quest|null}> {
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
  return {profile,activeQuest};
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
export async function eraseProgress(user:AccountUser):Promise<void> {
  if(!isLive())throw new Error("Account access is not connected.");
  for(const table of ["quests","onboarding_drafts","profiles"]) {
    const {error}=await supabase().from(table).delete().eq("user_id",user.id);
    if(error)throw error;
  }
  for(const key of Object.keys(localStorage))if(key.startsWith(`zynth:quest:${user.id}:`)||key===onboardingKey(user.id))localStorage.removeItem(key);
  const legacy=(readLocal(LS_ACCOUNT)??readLocal(LS_USER)) as {email?:string}|null;
  if(legacy?.email?.toLowerCase()===user.email.toLowerCase())for(const key of [LS_USER,LS_ACCOUNT,LS_PROFILE,LS_QUEST])localStorage.removeItem(key);
}
