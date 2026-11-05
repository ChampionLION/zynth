import {supabase,cachedSessionUser,publicSupabaseConfig} from "./supabase";
import {LEARNING_UNITS} from "./learning-content";
import {OFFLINE_PACK_SIZE,emptyJournal,mergeJournals,parseJournal,readOfflinePack,writeOfflinePack,type OfflinePack,type StudyJournal,type StoredLesson} from "./offline-learning";
import type {Profile} from "./types";
import type {AccountUser} from "./account-flow";
const deviceKey="zynth:study-device";
function deviceId():string {let id=localStorage.getItem(deviceKey);if(!id){id=crypto.randomUUID();localStorage.setItem(deviceKey,id);}return id;}
export function nextLessons(profile:Profile,journal:StudyJournal):StoredLesson[] {
 const start=journal.cursors[profile.domain]??0,units=LEARNING_UNITS[profile.domain];
 return Array.from({length:OFFLINE_PACK_SIZE},(_,i)=>{
  const sequence=start+i,unit=units[sequence%units.length],labels=[unit.answer,...unit.alternatives],offset=sequence%3;
  const options=labels.map((_,index)=>({key:"ABC"[index],label:labels[(index+offset)%3]}));
  return {id:`foundation-v1:${profile.domain}:${sequence}`,sequence,domain:profile.domain,title:unit.title,
   learning:{version:1,objective:unit.title,lessons:unit.lessons,check:{question:unit.question,options,correct_option:options.find(o=>o.label===unit.answer)!.key,explanation:unit.explanation}}};
 });
}
/** Study history is editable account metadata, never a source of XP or authority.
 * Each device writes its own top-level journal key so concurrent devices cannot
 * replace one another's progress. Their monotonic cursors merge on every sync.
 */
export async function syncOfflineStudy(user:AccountUser,profile:Profile,quest:OfflinePack["quest"],mode:OfflinePack["mode"]):Promise<OfflinePack> {
 const {data:{session},error:sessionError}=await supabase().auth.getSession();
 if(sessionError||session?.user.id!==user.id)throw new Error("Sign in again to sync lessons.");
 const {data,error}=await supabase().auth.getUser(session.access_token);if(error||data.user?.id!==user.id)throw new Error("Sign in again to sync lessons.");
 const metadata=data.user.user_metadata;
 const remote=Object.entries(metadata).filter(([key])=>key.startsWith("zynth_study_")).map(([,value])=>parseJournal(value));
 const local=readOfflinePack(user.id),journal=mergeJournals(...remote,local?.journal??emptyJournal());
 const device=`zynth_study_${deviceId()}`;
 if(JSON.stringify(parseJournal(metadata[device]))!==JSON.stringify(journal)){
  if(cachedSessionUser()?.id!==user.id)throw new Error("Your account changed.");
  const {url,key}=publicSupabaseConfig();
  // Pin the request to the verified session even if another tab changes accounts
  // while it is in flight. Never let a cached A journal be written as account B.
  const response=await fetch(`${url}/auth/v1/user`,{method:"PUT",cache:"no-store",signal:AbortSignal.timeout(20000),headers:{apikey:key,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({data:{[device]:journal}})});
  const saved=await response.json();
  if(!response.ok||saved.id!==user.id)throw new Error("Your lesson progress is saved here. Reconnect to sync.");
 }
 // Merge again: an offline answer may have been saved while the request was in flight.
 const newest=readOfflinePack(user.id),latest=mergeJournals(journal,newest?.journal??emptyJournal());
 if(cachedSessionUser()?.id!==user.id)throw new Error("Your account changed. Please reopen your lessons.");
 const pack:OfflinePack={version:1,owner:user.id,user,profile,quest,mode,lessons:nextLessons(profile,latest),journal:latest,updatedAt:new Date().toISOString()};
 writeOfflinePack(pack);return pack;
}
/** Initial local snapshot keeps the active quest available even before sync finishes. */
export function cacheOfflineJourney(user:AccountUser,profile:Profile,quest:OfflinePack["quest"],mode:OfflinePack["mode"]):void {
 const previous=readOfflinePack(user.id),journal=previous?.journal??emptyJournal();
 // Only a successful online sync replenishes the three-lesson pack.
 writeOfflinePack({version:1,owner:user.id,user,profile,quest,mode,lessons:previous?.lessons??nextLessons(profile,journal),journal,updatedAt:previous?.updatedAt??new Date().toISOString()});
}
