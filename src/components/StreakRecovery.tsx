"use client";
import {useRef,useState} from "react";
import type {Profile} from "@/lib/types";
import {useZynth} from "@/lib/store";
import {restoreStreak,streakRecovery,type StreakRecovery as Recovery} from "@/lib/engines/streak";
import {TOKEN_MAX} from "@/lib/engines/economy";
import {Dialog} from "./Dialog";

export function StreakRecovery({profile}:{profile:Profile}){
 const {mode,journeyAction,setProfile}=useZynth();
 const [quote,setQuote]=useState<Recovery|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const lock=useRef(false),recovery=streakRecovery(profile);
 if(!recovery||recovery.cost>TOKEN_MAX)return null;
 const restore=async()=>{
  if(lock.current||!quote)return;
  lock.current=true;setBusy(true);setError("");
  try{
   if(mode==="trusted"){
    if(!navigator.onLine)throw new Error("Connect to restore your streak.");
    await journeyAction({kind:"restore_streak",gap:quote.gap});
   }else{const next=structuredClone(profile);restoreStreak(next,quote.gap);await setProfile(next);}
   setQuote(null);
  }catch(e){setError(e instanceof Error?e.message:"Please try again.");}
  finally{lock.current=false;setBusy(false);}
 };
 return <><button className="quiet-link" onClick={()=>{setError("");setQuote(recovery);}}>Restore streak</button>
 {quote&&<Dialog title="Restore your streak" onClose={()=>{if(!lock.current)setQuote(null);}}>
  <p>Use {quote.cost} Skip Token{quote.cost===1?"":"s"} to restore your {quote.streak}-day streak?</p>
  <p className="text-sm text-muted mt-2">{profile.tokens} Skip Token{profile.tokens===1?"":"s"} available</p>
  {error&&<p role="alert" className="mt-3 text-sm">{error}</p>}
  <div className="mt-5 flex gap-3"><button className="btn-primary" disabled={busy||profile.tokens<quote.cost} onClick={()=>void restore()}>{busy?"Restoring…":"Restore streak"}</button><button className="quiet-link" disabled={busy} onClick={()=>setQuote(null)}>Cancel</button></div>
 </Dialog>}</>;
}
