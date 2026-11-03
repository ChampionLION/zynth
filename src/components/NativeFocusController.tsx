"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {useZynth} from "@/lib/store";
import {hasNativeFocus,nativeFocusRequest,notifyNativeQuestCompleted} from "@/lib/native-focus";
import {Dialog} from "./Dialog";

export function NativeFocusController(){
 const {user,profile,activeQuest,pendingOutcome,hydrated,hydrationError}=useZynth(),pathname=usePathname(),router=useRouter();
 const [promptOwner,setPromptOwner]=useState<string|null>(null);
 const [error,setError]=useState("");
 const owner=user?.id??"",activeId=activeQuest?.id??"",pendingId=pendingOutcome?.questId??"",profileOwner=profile?.user_id??"";
 const dismiss=()=>{if(promptOwner)try{localStorage.setItem(`zynth:focus-permission:${promptOwner}`,"asked");}catch{/* Permission can still be requested in Settings. */}setPromptOwner(null);};
 useEffect(()=>{
  if(!hydrated||hydrationError||!hasNativeFocus())return;
  let current=true;
  const questId=activeId||pendingId;
  void nativeFocusRequest("bindOwner",{owner,questId}).then(state=>{
   if(!current)return;
   if(owner&&pendingId)notifyNativeQuestCompleted(owner,pendingId);
   else if(state.overlay&&activeId&&pathname!=="/quest")router.replace("/quest?nativeFocus=1");
   if(owner&&profileOwner===owner&&!state.overlay&&!state.overlayAllowed){
    let asked=false;try{asked=localStorage.getItem(`zynth:focus-permission:${owner}`)==="asked";}catch{/* Show the optional setup explanation if storage is unavailable. */}
    if(!asked)setPromptOwner(owner);
   }
  }).catch(()=>{/* Device focus never blocks ordinary account or quest access. */});
  return()=>{current=false;};
 },[owner,profileOwner,activeId,pendingId,hydrated,hydrationError,pathname,router]);
 if(!promptOwner||promptOwner!==owner)return null;
 return <Dialog title="Allow your quest to come to you." onClose={dismiss}><p>Android needs your permission to display a quest over other apps at the time you choose. Focus lasts three minutes or until you submit your quest, with an emergency exit always available.</p><p>On the next screen, allow Zynth to display over other apps. If you decline, you can allow repeat notifications in Settings instead. You can revoke either permission at any time.</p><div className="settings-actions"><button autoFocus className="settings-save" onClick={()=>{void nativeFocusRequest("permission",{kind:"overlay"}).then(()=>{dismiss();router.push("/settings#focus-title");}).catch(()=>setError("Could not open Android permissions. Open Settings to try again."));}}>Allow quest overlays</button><button onClick={()=>{dismiss();router.push("/settings#focus-title");}}>Use notifications instead</button></div>{error&&<p role="alert">{error}</p>}</Dialog>;
}
