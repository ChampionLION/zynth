"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState} from "react";
import {MotionConfig} from "framer-motion";
import {useZynth} from "@/lib/store";
import {DEFAULT_APPEARANCE,parseAppearance,resolvedTheme,type Appearance} from "@/lib/appearance";
import {cacheAppearance,cachedAppearance,loadAppearance,saveAppearance,pendingAppearance,queueAppearance,acknowledgeAppearance} from "@/lib/appearance-db";
type State={appearance:Appearance;save:(value:Appearance)=>Promise<void>;retry:()=>void;syncStatus:string;busy:boolean};
const Context=createContext<State|null>(null);
export function AppearanceProvider({children}:{children:React.ReactNode}){
 const owner=useZynth(s=>s.user?.id);
 const [appearance,setAppearance]=useState<Appearance>(DEFAULT_APPEARANCE),[syncStatus,setSyncStatus]=useState(""),[busy,setBusy]=useState(false);
 const ownerRef=useRef(owner);ownerRef.current=owner;
 const revision=useRef(0),saving=useRef(false);
 const pendingMemory=useRef<{owner:string;value:Appearance}|null>(null);
 useEffect(()=>{
   let current=true;const initial=++revision.current;
   setBusy(false);saving.current=false;pendingMemory.current=null;setSyncStatus("");setAppearance(owner?pendingAppearance(owner)??cachedAppearance(owner):DEFAULT_APPEARANCE);
   if(owner&&!pendingAppearance(owner))void loadAppearance(owner).then(remote=>{if(current&&revision.current===initial&&remote&&!pendingAppearance(owner)){setAppearance(remote);cacheAppearance(owner,remote);}}).catch(()=>{if(current)setSyncStatus("Account sync is unavailable. Appearance stays on this browser.");});
   return()=>{current=false;};
 },[owner]);
 useEffect(()=>{
   const media=matchMedia("(prefers-color-scheme: dark)");
   const apply=()=>{document.documentElement.dataset.theme=resolvedTheme(appearance.theme,media.matches);document.documentElement.dataset.motion=appearance.motion;};
   apply();media.addEventListener("change",apply);return()=>media.removeEventListener("change",apply);
 },[appearance]);
 useEffect(()=>{
   const sync=(event:StorageEvent)=>{if(owner&&event.key===`zynth:appearance:${owner}`&&!saving.current){revision.current++;setAppearance(cachedAppearance(owner));}};
   window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);
 },[owner]);
 const save=useCallback(async(value:Appearance)=>{
   if(!owner||saving.current)return;
   const clean=parseAppearance(value),saveOwner=owner,saveRevision=++revision.current;
   saving.current=true;setBusy(true);setAppearance(clean);pendingMemory.current={owner,value:clean};const cached=queueAppearance(owner,clean);setSyncStatus("Saving appearance…");
   try{await saveAppearance(owner,clean);acknowledgeAppearance(owner,clean);if(ownerRef.current===saveOwner&&revision.current===saveRevision){pendingMemory.current=null;setSyncStatus("Appearance saved to your account.");}}
   catch{if(ownerRef.current===saveOwner&&revision.current===saveRevision)setSyncStatus(cached?"Saved on this browser. Account sync is unavailable.":"Appearance changed for this visit. Account sync is unavailable.");}
   finally{if(ownerRef.current===saveOwner&&revision.current===saveRevision){saving.current=false;setBusy(false);}}
 },[owner]);
 const retry=useCallback(()=>{if(owner){const pending=pendingMemory.current?.owner===owner?pendingMemory.current.value:pendingAppearance(owner);if(pending)void save(pending);}},[owner,save]);
 useEffect(()=>{retry();window.addEventListener("online",retry);return()=>window.removeEventListener("online",retry);},[retry]);
 return <Context.Provider value={{appearance,save,retry,syncStatus,busy}}><MotionConfig reducedMotion={appearance.motion==="reduced"?"always":"user"}>{children}</MotionConfig></Context.Provider>;
}
export function useAppearance(){const value=useContext(Context);if(!value)throw new Error("Appearance provider is missing");return value;}
