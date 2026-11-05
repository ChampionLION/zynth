"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {useZynth} from "@/lib/store";
import {acknowledgeQueuedQuest,queuedQuest,cachedQuestDraft} from "@/lib/offline-learning";
import {saveQuestDraft} from "@/lib/db";
import {JourneyRequestError} from "@/lib/journey-client";

export function OfflineController(){
 const {user,profile,activeQuest,mode,hydrated}=useZynth(),path=usePathname();
 const [online,setOnline]=useState(true),[status,setStatus]=useState("");
 const running=useRef(false);
 useEffect(()=>{
  if(process.env.NODE_ENV!=="production"||!("serviceWorker" in navigator))return;
  void navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(()=>navigator.serviceWorker.ready).then(reg=>{
   (reg.active??navigator.serviceWorker.controller)?.postMessage({type:"CACHE_OFFLINE"});
  }).catch(()=>setStatus("Offline download is unavailable. Keep this page open and try again."));
 },[]);
 useEffect(()=>{
  if(!user||!profile||!hydrated)return;
  let disposed=false;
  void import("@/lib/offline-sync").then(module=>{if(!disposed)module.cacheOfflineJourney(user,profile,activeQuest,mode);}).catch(()=>setStatus("Device storage is full. Free space to save offline lessons."));
  return()=>{disposed=true;};
 },[user,profile,activeQuest,mode,hydrated]);
 const owner=user?.id;
 useEffect(()=>{
  if(!owner||!hydrated)return;
  let disposed=false;
  const sync=async()=>{
   setOnline(navigator.onLine);if(!navigator.onLine||running.current||disposed)return;
   running.current=true;
   try{
    let review="";
    await useZynth.getState().hydrate();
    if(disposed)return;
    const current=useZynth.getState();if(current.user?.id!==owner||!current.profile)return;
    const queued=queuedQuest(owner);
    if(queued&&current.mode==="trusted"){
     try{await current.completeQuest(queued.questId,queued.responseText);acknowledgeQueuedQuest(owner,queued);}
     catch(error){if(error instanceof JourneyRequestError&&[400,404,409,413,422].includes(error.status)){review="Your saved quest needs review. Open offline lessons to retry or keep a copy.";}else throw error;}
    }
    if(disposed||useZynth.getState().user?.id!==owner)return;
    const latest=useZynth.getState(),offline=await import("@/lib/offline-sync");
    if(latest.activeQuest){const draft=cachedQuestDraft(owner,latest.activeQuest);if(draft)await saveQuestDraft(owner,latest.activeQuest.id,draft);}
    const pack=await offline.syncOfflineStudy(latest.user!,latest.profile!,latest.activeQuest,latest.mode);
    if(!disposed)setStatus(review||`${pack.lessons.length} lessons saved for offline use.`);
   }catch{if(!disposed)setStatus("Saved on this device. Waiting to sync and refill your lessons.");}
   finally{running.current=false;}
  };
  const connection=()=>{setOnline(navigator.onLine);if(navigator.onLine){void sync();}};
  const visible=()=>{if(document.visibilityState==="visible")connection();};
  const timer=window.setInterval(connection,60000);
  void sync();
  window.addEventListener("online",connection);window.addEventListener("offline",connection);
  window.addEventListener("zynth-study-completed",connection);window.addEventListener("zynth-native-resume",connection);
  document.addEventListener("visibilitychange",visible);
  return()=>{disposed=true;clearInterval(timer);window.removeEventListener("online",connection);window.removeEventListener("offline",connection);window.removeEventListener("zynth-study-completed",connection);window.removeEventListener("zynth-native-resume",connection);document.removeEventListener("visibilitychange",visible);};
 },[owner,hydrated]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};},[]);
 useEffect(()=>{
  const navigate=(event:MouseEvent)=>{if(navigator.onLine||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;if(!link||link.target==="_blank"||link.hasAttribute("download"))return;const url=new URL(link.href);if(url.origin!==location.origin)return;event.preventDefault();event.stopPropagation();location.assign("/offline");};
  document.addEventListener("click",navigate,true);return()=>document.removeEventListener("click",navigate,true);
 },[]);
 if(!user||!profile)return null;
 if(online&&!status.includes("Waiting")&&!status.includes("review")&&!status.includes("unavailable")&&!status.includes("full"))return null;
 return <aside className="offline-banner" role="status"><span>{online?status:"You’re offline. Your saved lessons and answers are available."}</span>{path!=="/offline"&&<Link href="/offline">Open offline lessons →</Link>}</aside>;
}
