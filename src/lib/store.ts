"use client";
import {create} from "zustand";
import type {Profile,Quest,ZynthEvent,GradeResult} from "./types";
import type {AccountUser,OnboardingDraft} from "./account-flow";
import {getCurrentUser} from "./auth";
import {loadAccountJourney,loadOnboardingDraft,saveProfile,saveActiveQuest,clearQuestDraft,ensurePlannedQuest,saveEditableProfile,retireQuest} from "./db";
import type {EditableProfile} from "./appearance";
import type {PipelineResult} from "./engines/pipeline";
interface GradeRevealData {gradeResult:GradeResult;expEarned:number;streakMultiplier:number;changedStats:string[]}
interface ZynthStore {
 user:AccountUser|null;profile:Profile|null;activeQuest:Quest|null;onboardingDraft:OnboardingDraft|null;
 eventQueue:ZynthEvent[];gradeReveal:GradeRevealData|null;hydrated:boolean;loading:boolean;hydrationError:string|null;
 hydrate:()=>Promise<void>;setProfile:(p:Profile)=>Promise<void>;setActiveQuest:(q:Quest|null,ownerId:string)=>Promise<void>;
 createPlannedQuest:(q:Quest,ownerId:string)=>Promise<void>;
 updateEditableProfile:(fields:EditableProfile)=>Promise<void>;
 retireActiveQuest:(status:"completed"|"skipped",ownerId:string)=>Promise<void>;
 applyPipelineResult:(r:PipelineResult,reveal:GradeRevealData)=>Promise<void>;shiftEvent:()=>ZynthEvent|undefined;clearGradeReveal:()=>void;reset:()=>void;
}
let authEpoch=0;
let pending:{epoch:number;promise:Promise<void>}|null=null;
const empty={user:null,profile:null,activeQuest:null,onboardingDraft:null,eventQueue:[],gradeReveal:null,hydrated:false,loading:false,hydrationError:null};
export const useZynth=create<ZynthStore>((set,get)=>({
 ...empty,
 hydrate:()=>{
   if(pending?.epoch===authEpoch)return pending.promise;
   const epoch=authEpoch;
   set({loading:true,hydrationError:null});
   const promise=(async()=>{
     try {
       const user=await getCurrentUser();
       if(epoch!==authEpoch)return;
       if(!user){set({...empty,hydrated:true});return;}
       set({user});
       const journey=await loadAccountJourney(user);
       const onboardingDraft=journey.profile ? null : await loadOnboardingDraft(user.id);
       if(epoch!==authEpoch)return;
       set({...journey,onboardingDraft,user,hydrated:true,loading:false,hydrationError:null});
     }catch{
       if(epoch===authEpoch)set({hydrated:true,loading:false,hydrationError:"We couldn’t load your saved journey. Check your connection and try again."});
     }finally{if(pending?.epoch===epoch)pending=null;}
   })();
   pending={epoch,promise};
   return promise;
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
   if(quest)try{await retireQuest(user.id,quest.id,"completed");}catch{/* Committed history prevents reopening this completed quest. */}
 },
 shiftEvent:()=>{const[head,...rest]=get().eventQueue;set({eventQueue:rest});return head;},
 clearGradeReveal:()=>set({gradeReveal:null}),
 reset:()=>{authEpoch++;pending=null;set({...empty});},
}));
