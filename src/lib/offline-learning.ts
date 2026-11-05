import type {Domain,Profile,Quest,QuestLearning} from "./types";
import type {AccountUser} from "./account-flow";
import {parseQuestDraft,newestDraft} from "./account-flow";

export const OFFLINE_PACK_SIZE=3;
export interface StudyReply {domain:Domain;sequence:number;answer:string;at:string}
export interface StudyJournal {version:1;cursors:Partial<Record<Domain,number>>;recent:StudyReply[]}
export interface StoredLesson {id:string;sequence:number;domain:Domain;title:string;learning:QuestLearning}
export interface OfflinePack {
 version:1;owner:string;user:AccountUser;profile:Profile;quest:Quest|null;mode:"legacy"|"trusted";
 lessons:StoredLesson[];journal:StudyJournal;updatedAt:string;
}
export interface QueuedQuest {questId:string;responseText:string;createdAt:string}
const key=(owner:string)=>`zynth:offline:${owner}`;
const queueKey=(owner:string)=>`${key(owner)}:submission`;
export const emptyJournal=():StudyJournal=>({version:1,cursors:{},recent:[]});
const domains:Domain[]=["TECHNICAL","ANALYTICAL","CREATIVE","SOCIAL","STRATEGIC"];
export function parseJournal(value:unknown):StudyJournal {
 const journal=value as StudyJournal;if(journal?.version!==1||!journal.cursors)return emptyJournal();
 const cursors:StudyJournal["cursors"]={};
 for(const domain of domains){const n=journal.cursors[domain];if(n!==undefined&&Number.isSafeInteger(n)&&n>=0)cursors[domain]=n;}
 const recent=Array.isArray(journal.recent)?journal.recent.filter(r=>domains.includes(r.domain)&&Number.isSafeInteger(r.sequence)&&r.sequence>=0&&typeof r.answer==="string"&&r.answer.length<=1000&&typeof r.at==="string").slice(-3):[];
 return {version:1,cursors,recent};
}
export function mergeJournals(...journals:StudyJournal[]):StudyJournal {
 const result=emptyJournal(),replies=new Map<string,StudyReply>();
 for(const raw of journals){const journal=parseJournal(raw);
  for(const domain of domains)result.cursors[domain]=Math.max(result.cursors[domain]??0,journal.cursors[domain]??0);
  for(const reply of journal.recent)replies.set(`${reply.domain}:${reply.sequence}`,reply);
 }
 result.recent=[...replies.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-3);return result;
}
export function readOfflinePack(owner:string):OfflinePack|null {
 try{const value=JSON.parse(localStorage.getItem(key(owner))??"null") as OfflinePack|null;
  if(value?.version!==1||value.owner!==owner||value.profile?.user_id!==owner||value.user?.id!==owner||!Array.isArray(value.lessons)||value.lessons.length>3)return null;
  return {...value,journal:parseJournal(value.journal)};
 }catch{return null;}
}
export function writeOfflinePack(pack:OfflinePack):void {
 localStorage.setItem(key(pack.owner),JSON.stringify(pack));
 if(typeof window!=="undefined")window.dispatchEvent(new Event("zynth-offline-updated"));
}
export function clearOfflinePack(owner:string):void {try{localStorage.removeItem(key(owner));localStorage.removeItem(queueKey(owner));}catch{/* Sign-out still clears the auth session when storage is unavailable. */}}
export function queuedQuest(owner:string):QueuedQuest|null {
 try{const q=JSON.parse(localStorage.getItem(queueKey(owner))??"null") as QueuedQuest|null;
  return q&&typeof q.questId==="string"&&typeof q.responseText==="string"&&q.responseText.trim()&&q.responseText.length<=90000?q:null;
 }catch{return null;}
}
export function queueQuest(owner:string,questId:string,responseText:string):void {
 if(!responseText.trim()||responseText.length>90000)throw new Error("Your answer cannot be saved. Shorten it and try again.");
 const existing=queuedQuest(owner);if(existing&&existing.questId!==questId)throw new Error("Sync your saved quest before submitting another one.");
 localStorage.setItem(queueKey(owner),JSON.stringify({questId,responseText,createdAt:new Date().toISOString()}));
 window.dispatchEvent(new Event("zynth-offline-updated"));
}
export function acknowledgeQueuedQuest(owner:string,reply:QueuedQuest):void {
 if(JSON.stringify(queuedQuest(owner))===JSON.stringify(reply))localStorage.removeItem(queueKey(owner));
}
export function cachedQuestDraft(owner:string,quest:Quest) {
 try{return newestDraft(quest.draft??null,parseQuestDraft(JSON.parse(localStorage.getItem(`zynth:quest:${owner}:${quest.id}`)??"null"),quest.steps.length));}catch{return quest.draft??null;}
}
export function finishStudy(pack:OfflinePack,lesson:StoredLesson,answer:string):OfflinePack {
 const cursor=pack.journal.cursors[lesson.domain]??0;
 if(lesson.sequence!==cursor||!pack.lessons.some(q=>q.id===lesson.id))throw new Error("Finish the earlier lesson first.");
 if(!answer.trim())throw new Error("Choose an answer before continuing.");
 if(answer.length>1000)throw new Error("Keep this small check under 1,000 characters. Your explanation can be brief.");
 return {...pack,journal:mergeJournals(pack.journal,{version:1,cursors:{[lesson.domain]:cursor+1},recent:[{domain:lesson.domain,sequence:cursor,answer,at:new Date().toISOString()}]})};
}
