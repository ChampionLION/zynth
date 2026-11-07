"use client";
import {create} from "zustand";
import type {Profile,Quest,ZynthEvent,GradeResult} from "./types";
import type {AccountUser,OnboardingDraft} from "./account-flow";
import {getCurrentUser} from "./auth";
import {loadAccountJourney,loadOnboardingDraft,saveProfile,saveActiveQuest,clearQuestDraft,ensurePlannedQuest,saveEditableProfile,retireQuest} from "./db";
import type {EditableProfile} from "./appearance";
import type {PipelineResult} from "./engines/pipeline";
import {sendJourneyAction,sendCompletion,journeyRequest,prepareNextQuest} from "./journey-client";
import {outcomePresentation,type JourneyAction,type JourneyActionResult,type PendingOutcome} from "./journey-contract";
import {notifyNativeQuestCompleted} from "./native-focus";
import {cachedSessionUser} from "./supabase";
import {readOfflinePack} from "./offline-learning";
import {readJourneyCache,saveJourneyCache,savedReplies,saveReplies,nextCachedLesson} from "./lesson-cache";
import {gradeLearningCheck} from "./learning";
import {runPostGradePipeline} from "./engines/pipeline";
import {runExploitCheck} from "./engines/exploit";
import {mockEvolveSkillName,mockDiscoveryMessage,mockBehaviorSummary} from "./llm/mock";
interface GradeRevealData {gradeResult:GradeResult;expEarned:number;streakMultiplier:number;changedStats:string[]}
interface ZynthStore {
 user:AccountUser|null;profile:Profile|null;activeQuest:Quest|null;onboardingDraft:OnboardingDraft|null;
 eventQueue:ZynthEvent[];gradeReveal:GradeRevealData|null;hydrated:boolean;loading:boolean;hydrationError:string|null;
 mode:"legacy"|"trusted";pendingOutcome:PendingOutcome|null;
 journeyAction:(input:JourneyAction)=>Promise<JourneyActionResult>;
 completeQuest:(questId:string,responseText:string)=>Promise<void>;
 ackGrade:()=>Promise<void>;ackEvent:()=>Promise<void>;
 hydrate:()=>Promise<void>;setProfile:(p:Profile)=>Promise<void>;setActiveQuest:(q:Quest|null,ownerId:string)=>Promise<void>;
 createPlannedQuest:(q:Quest,ownerId:string)=>Promise<void>;
 updateEditableProfile:(fields:EditableProfile)=>Promise<void>;
 retireActiveQuest:(status:"completed"|"skipped",ownerId:string)=>Promise<void>;
 applyPipelineResult:(r:PipelineResult,reveal:GradeRevealData)=>Promise<void>;shiftEvent:()=>ZynthEvent|undefined;clearGradeReveal:()=>void;reset:()=>void;
}
let authEpoch=0;
let pending:{epoch:number;promise:Promise<void>}|null=null;
const empty={user:null,profile:null,activeQuest:null,onboardingDraft:null,eventQueue:[],gradeReveal:null,hydrated:false,loading:false,hydrationError:null,mode:"legacy" as const,pendingOutcome:null};
export const useZynth=create<ZynthStore>((set,get)=>({
 ...empty,
 hydrate:()=>{
   if(pending?.epoch===authEpoch)return pending.promise;
   const epoch=authEpoch;
   // Background sync must not tear down an open quest or its microphone session.
   set({loading:!get().hydrated,hydrationError:null});
   const promise=(async()=>{
     try {
       const savedOwner=cachedSessionUser()?.id;
       if(savedOwner&&((typeof navigator!=="undefined"&&navigator.onLine===false)||savedReplies(savedOwner).length)){
         const cache=readJourneyCache(savedOwner);
         if(cache){const presentation=cache.pendingOutcome?outcomePresentation(cache.pendingOutcome):{gradeReveal:null,events:[]};set({...empty,...cache,activeQuest:cache.activeQuest??nextCachedLesson(savedOwner,cache.profile),gradeReveal:presentation.gradeReveal,eventQueue:presentation.events,hydrated:true,loading:false});return;}
       }
       if(typeof navigator!=="undefined"&&navigator.onLine===false){
         const owner=cachedSessionUser()?.id,cache=owner?readOfflinePack(owner):null;
         if(cache){set({...empty,user:cache.user,profile:cache.profile,activeQuest:cache.quest,mode:cache.mode,hydrated:true,loading:false});return;}
       }
       const user=await getCurrentUser();
       if(epoch!==authEpoch)return;
       if(!user){set({...empty,hydrated:true});return;}
       set({user});
       const journey=await loadAccountJourney(user);
       const onboardingDraft=journey.profile ? null : await loadOnboardingDraft(user.id);
       if(epoch!==authEpoch)return;
       const presentation=journey.pendingOutcome?outcomePresentation(journey.pendingOutcome):{gradeReveal:null,events:[]};
       set({...journey,onboardingDraft,user,gradeReveal:presentation.gradeReveal,eventQueue:presentation.events,hydrated:true,loading:false,hydrationError:null});
     }catch{
       if(epoch===authEpoch)set({hydrated:true,loading:false,hydrationError:"We couldn’t load your saved journey. Check your connection and try again."});
     }finally{if(pending?.epoch===epoch)pending=null;}
   })();
   pending={epoch,promise};
   // A cache restore can finish synchronously before the assignment above.
   // Clear its receipt in a microtask too, so reconnection can hydrate afresh.
   void promise.finally(()=>{if(pending?.promise===promise)pending=null;});
   return promise;
 },
 journeyAction:async input=>{
   const owner=get().user?.id,epoch=authEpoch;if(!owner||get().mode!=="trusted")throw new Error("Please reopen your journey.");
   let result:JourneyActionResult;
   if(!navigator.onLine&&get().profile){
    if(input.kind==="energy"){
     const profile={...get().profile!,energy_today:input.energy,energy_date:new Date().toISOString().slice(0,10)};
     localStorage.setItem(`zynth:energy:${owner}`,JSON.stringify(input));set({profile});
     const cache=readJourneyCache(owner);if(cache)saveJourneyCache({...cache,profile});return {profile,quest:get().activeQuest};
    }
    if(input.kind==="daily_question")return {profile:get().profile,quest:get().activeQuest,question:null};
   }
   if(input.kind==="generate"&&get().profile&&!get().activeQuest)result=await prepareNextQuest(owner,get().profile!);
   else result=await sendJourneyAction(owner,input);
   if(epoch!==authEpoch||get().user?.id!==owner)throw new Error("Your account changed. Please sign in again.");
   if(result.profile&&result.profile.user_id!==owner)throw new Error("Please sign in again.");
   set(state=>({profile:result.profile,onboardingDraft:result.profile?null:state.onboardingDraft,activeQuest:input.kind==="skip"?null:result.quest?{...result.quest,draft:result.quest.id===state.activeQuest?.id?state.activeQuest.draft:result.quest.draft}:input.kind==="generate"?null:state.activeQuest}));
   const journeyCache=readJourneyCache(owner);if(journeyCache&&result.profile)saveJourneyCache({...journeyCache,profile:result.profile,activeQuest:get().activeQuest});
   return result;
 },
 completeQuest:async(questId,responseText)=>{
   const owner=get().user?.id,epoch=authEpoch;if(!owner||get().mode!=="trusted")throw new Error("Please reopen your journey.");
   const local=async()=>{
    const state=get(),quest=state.activeQuest,cache=readJourneyCache(owner);
    if(!quest||quest.id!==questId||!state.profile)throw new Error("Reopen your lesson.");
    const gradeResult=gradeLearningCheck(quest,responseText);
    const replies=savedReplies(owner),packKey=cache?.pack&&(cache.pack.lessons.some(l=>l.quest.id===questId)||cache.pack.mission?.id===questId)?cache.pack.key:undefined;
    saveReplies(owner,[...replies.filter(r=>r.quest.id!==questId),{quest,responseText,packKey,gradeSeen:false,eventCursor:0}]);
    if(!gradeResult)throw new Error("Reply saved.");
    const result=await runPostGradePipeline({profile:state.profile,quest,gradeResult,responseText,responseTimeSeconds:Math.max(0,(Date.now()-Date.parse(quest.created_at))/1000),exploit:runExploitCheck({profile:state.profile,quest,response:responseText,responseTimeSeconds:180}),swiftModeUsed:false,enrichment:{skillName:async(name,_profile,tier)=>mockEvolveSkillName(name,tier),discoveryMessage:async(name,profile)=>mockDiscoveryMessage(name,profile.profession),behaviorSummary:async profile=>mockBehaviorSummary(profile)}});
    if(epoch!==authEpoch||get().user?.id!==owner)return;
    const outcome={questId,result:{...result,gradeResult},gradeSeen:false,eventCursor:0};const presentation=outcomePresentation(outcome);
    set({profile:result.profile,activeQuest:null,pendingOutcome:outcome,gradeReveal:presentation.gradeReveal,eventQueue:presentation.events});
    if(cache)saveJourneyCache({...cache,profile:result.profile,activeQuest:null,pendingOutcome:outcome});
   };
   if(typeof navigator!=="undefined"&&!navigator.onLine){await local();return;}
   let response;
   try{response=await sendCompletion(owner,questId,responseText);}catch(error){if(error instanceof TypeError||(error instanceof DOMException&&error.name==="TimeoutError")){await local();return;}throw error;}
   if(epoch!==authEpoch||get().user?.id!==owner||response.profile.user_id!==owner)throw new Error("Your account changed. Please sign in again.");
   const pendingOutcome={questId,result:response.result,gradeSeen:false,eventCursor:0};const presentation=outcomePresentation(pendingOutcome);
   set({profile:response.profile,activeQuest:null,pendingOutcome,gradeReveal:presentation.gradeReveal,eventQueue:presentation.events});
   clearQuestDraft(owner,questId);
   notifyNativeQuestCompleted(owner,questId);
 },
 ackGrade:async()=>{
   const owner=get().user?.id,pending=get().pendingOutcome,epoch=authEpoch;
   if(get().mode==="trusted"&&owner&&pending){
    const replies=savedReplies(owner);
    if(replies.some(r=>r.quest.id===pending.questId))saveReplies(owner,replies.map(r=>r.quest.id===pending.questId?{...r,gradeSeen:true}:r));
    else if(navigator.onLine)await journeyRequest(owner,"ack",{questId:pending.questId,grade:true,cursor:pending.eventCursor});
    else localStorage.setItem(`zynth:presentation:${owner}`,JSON.stringify({questId:pending.questId,grade:true,cursor:pending.eventCursor}));
    if(epoch!==authEpoch||get().user?.id!==owner)throw new Error("Your account changed.");
    set({pendingOutcome:pending.result.events.length?{...pending,gradeSeen:true}:null});
   }
   set({gradeReveal:null});
 },
 ackEvent:async()=>{
   const owner=get().user?.id,pending=get().pendingOutcome,epoch=authEpoch;
   if(get().mode==="trusted"&&owner&&pending){
    const replies=savedReplies(owner);
    if(replies.some(r=>r.quest.id===pending.questId))saveReplies(owner,replies.map(r=>r.quest.id===pending.questId?{...r,gradeSeen:true,eventCursor:pending.eventCursor+1}:r));
    else if(navigator.onLine)await journeyRequest(owner,"ack",{questId:pending.questId,grade:true,cursor:pending.eventCursor+1});
    else localStorage.setItem(`zynth:presentation:${owner}`,JSON.stringify({questId:pending.questId,grade:true,cursor:pending.eventCursor+1}));
    if(epoch!==authEpoch||get().user?.id!==owner)throw new Error("Your account changed.");
    set({pendingOutcome:pending.eventCursor+1<pending.result.events.length?{...pending,eventCursor:pending.eventCursor+1}:null});
   }
   set(state=>({eventQueue:state.eventQueue.slice(1)}));
 },
 setProfile:async p=>{
   const user=get().user;
   if(!user||user.id!==p.user_id)throw new Error("Please sign in again before saving.");
   const epoch=authEpoch;
   await saveProfile(p);
   if(epoch!==authEpoch||get().user?.id!==user.id)throw new Error("Your account changed. Please sign in again.");
   set({profile:p,onboardingDraft:null});
 },
 setActiveQuest:async(q,ownerId)=>{
   const user=get().user;if(!user||user.id!==ownerId)throw new Error("Please sign in again before saving.");
   const epoch=authEpoch;
   await saveActiveQuest(user.id,q);
   if(epoch!==authEpoch||get().user?.id!==user.id)throw new Error("Your account changed. Please sign in again.");
   set({activeQuest:q});
 },
 createPlannedQuest:async(q,ownerId)=>{
   const user=get().user;if(!user||user.id!==ownerId)throw new Error("Please sign in again before saving.");
   const epoch=authEpoch;
   const activeQuest=await ensurePlannedQuest(user.id,q);
   if(epoch!==authEpoch||get().user?.id!==user.id)throw new Error("Your account changed. Please sign in again.");
   set({activeQuest});
 },
 updateEditableProfile:async(fields)=>{
   const owner=get().user?.id,epoch=authEpoch;
   if(!owner||get().profile?.user_id!==owner)throw new Error("Please sign in again.");
   const saved=await saveEditableProfile(owner,fields);
   if(epoch!==authEpoch||get().user?.id!==owner)throw new Error("Your account changed. Please sign in again.");
   set(state=>({profile:state.profile?{...state.profile,...saved}:null}));
 },
 retireActiveQuest:async(status,ownerId)=>{
   const quest=get().activeQuest,epoch=authEpoch;
   if(!quest||get().user?.id!==ownerId)throw new Error("Please reopen your journey.");
   await retireQuest(ownerId,quest.id,status);
   if(epoch!==authEpoch||get().user?.id!==ownerId)return;
   if(get().activeQuest?.id===quest.id)set({activeQuest:null});
 },
 applyPipelineResult:async(r,reveal)=>{
   const user=get().user;if(!user||user.id!==r.profile.user_id)throw new Error("Please sign in again before saving.");
   const epoch=authEpoch;
   await saveProfile(r.profile);
   if(epoch!==authEpoch||get().user?.id!==user.id)throw new Error("Your account changed. Please sign in again.");
   const quest=get().activeQuest;
   set({profile:r.profile,eventQueue:[...get().eventQueue,...r.events],gradeReveal:reveal,activeQuest:null});
   if(quest)clearQuestDraft(user.id,quest.id);
   if(quest)notifyNativeQuestCompleted(user.id,quest.id);
   if(quest)try{await retireQuest(user.id,quest.id,"completed");}catch{/* Committed history prevents reopening this completed quest. */}
 },
 shiftEvent:()=>{const[head,...rest]=get().eventQueue;set({eventQueue:rest});return head;},
 clearGradeReveal:()=>set({gradeReveal:null}),
 reset:()=>{authEpoch++;pending=null;set({...empty});},
}));
