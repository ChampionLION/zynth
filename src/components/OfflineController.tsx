"use client";
import {useEffect,useRef} from "react";
import {useZynth} from "@/lib/store";
import {readJourneyCache,saveJourneyCache,savedReplies,saveReplies,type LessonPack} from "@/lib/lesson-cache";
import {journeyRequest,sendCompletion} from "@/lib/journey-client";
import {cachedQuestDraft} from "@/lib/offline-learning";
import {saveQuestDraft,saveEditableProfile} from "@/lib/db";
export function OfflineController(){
 const {user,profile,activeQuest,mode,pendingOutcome,hydrated}=useZynth(),running=useRef(false),owner=user?.id;
 useEffect(()=>{if(process.env.NODE_ENV==="production"&&"serviceWorker" in navigator)void navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).catch(()=>{});},[]);
 useEffect(()=>{if(!user||!profile||!hydrated)return;try{saveJourneyCache({user,profile,activeQuest,mode,pendingOutcome,pack:readJourneyCache(user.id)?.pack??null});}catch{/* Keep the current page usable if device storage is full. */}},[user,profile,activeQuest,mode,pendingOutcome,hydrated]);
 useEffect(()=>{
  if(!owner||!hydrated)return;let disposed=false;
  const sync=async()=>{
   if(disposed||running.current||!navigator.onLine)return;running.current=true;
   try{
    const energy=localStorage.getItem(`zynth:energy:${owner}`);if(energy){await journeyRequest(owner,"action",JSON.parse(energy));localStorage.removeItem(`zynth:energy:${owner}`);}
    const edits=localStorage.getItem(`zynth:profile-edits:${owner}`);if(edits){await saveEditableProfile(owner,JSON.parse(edits));localStorage.removeItem(`zynth:profile-edits:${owner}`);}
    for(const reply of savedReplies(owner)){
     if(useZynth.getState().user?.id!==owner||disposed)return;
     if(reply.packKey)await journeyRequest(owner,"lessons",{key:reply.packKey,questId:reply.quest.id});
     const committed=await sendCompletion(owner,reply.quest.id,reply.responseText);
     await journeyRequest(owner,"ack",{questId:reply.quest.id,grade:reply.gradeSeen,cursor:Math.min(reply.eventCursor,committed.result.events.length)});
     saveReplies(owner,savedReplies(owner).filter(r=>r.quest.id!==reply.quest.id));
    }
    if(savedReplies(owner).length)return;
    const receipt=localStorage.getItem(`zynth:presentation:${owner}`);if(receipt){await journeyRequest(owner,"ack",JSON.parse(receipt));localStorage.removeItem(`zynth:presentation:${owner}`);}
    await useZynth.getState().hydrate();
    let current=useZynth.getState();if(disposed||current.user?.id!==owner||!current.profile||current.mode!=="trusted")return;
    if(current.activeQuest&&!current.activeQuest.learning&&current.activeQuest.type!=="mission"){
     const upgraded=await journeyRequest<{profile:typeof current.profile;quest:typeof current.activeQuest}>(owner,"lessons",{},"PUT");
     if(disposed||useZynth.getState().user?.id!==owner)return;
     if(upgraded.quest)upgraded.quest.draft=cachedQuestDraft(owner,upgraded.quest);
     useZynth.setState({profile:upgraded.profile,activeQuest:upgraded.quest});
    }
    current=useZynth.getState();
    if(current.activeQuest){const draft=cachedQuestDraft(owner,current.activeQuest);if(draft)await saveQuestDraft(owner,current.activeQuest.id,draft);}
    const pack=await journeyRequest<LessonPack>(owner,"lessons");
    const latest=useZynth.getState();if(disposed||latest.user?.id!==owner||!latest.profile)return;
    saveJourneyCache({user:latest.user,profile:latest.profile,activeQuest:latest.activeQuest,mode:latest.mode,pendingOutcome:latest.pendingOutcome,pack});
    void import("@/lib/engines/leaderboard").then(engine=>engine.getLeaderboard(latest.profile!,"global","all")).catch(()=>{});
   }catch{/* Keep queued work and the last complete snapshot; retry on return. */}finally{running.current=false;}
  };
  const visible=()=>{if(document.visibilityState==="visible")void sync();};const retry=()=>void sync();
  void sync();const timer=setInterval(retry,60000);
  window.addEventListener("online",retry);window.addEventListener("zynth-native-resume",retry);document.addEventListener("visibilitychange",visible);
  return()=>{disposed=true;clearInterval(timer);window.removeEventListener("online",retry);window.removeEventListener("zynth-native-resume",retry);document.removeEventListener("visibilitychange",visible);};
 },[owner,hydrated]);
 useEffect(()=>{const navigate=(event:MouseEvent)=>{if(navigator.onLine||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;if(!link||link.target==="_blank"||link.hasAttribute("download"))return;const url=new URL(link.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;event.preventDefault();event.stopPropagation();location.assign(url.href);};document.addEventListener("click",navigate,true);return()=>document.removeEventListener("click",navigate,true);},[]);
 return null;
}
