"use client";
import {useEffect,useRef,useState} from "react";
import {useZynth} from "@/lib/store";
import {REGIONS,savedWorld} from "@/lib/world";
import type {Profile} from "@/lib/types";
import {Button,Card} from "./ui/Atlas";
export function WorldAtlas({profile,compact=false}:{profile:Profile;compact?:boolean}){
 const action=useZynth(s=>s.journeyAction),mode=useZynth(s=>s.mode);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);const lock=useRef(false);
 const state=savedWorld(profile),region=REGIONS.find(r=>r.id===state.selected)??REGIONS[0];
 useEffect(()=>{
  if(mode!=="trusted"||!navigator.onLine)return;
  let current=true;
  void action({kind:"world",requestId:crypto.randomUUID()}).catch(()=>{if(current)setError("Could not refresh the atlas.");});
  return()=>{current=false;};
 },[action,mode,profile.user_id,profile.quest_history.length]);
 async function select(id:string){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try{if(!navigator.onLine)throw new Error("Connect to change regions.");await action({kind:"world",requestId:crypto.randomUUID(),region:id as typeof region.id});}
  catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{lock.current=false;setBusy(false);}
 }
 return <Card className="atlas-panel" aria-label="World atlas"><nav aria-label="Regions">{REGIONS.map(r=><Button key={r.id} variant="ghost" disabled={busy||!state.discovered.includes(r.id)} disabledReason={busy?"Loading…":!state.discovered.includes(r.id)?"Locked":undefined} aria-pressed={state.selected===r.id} onClick={()=>void select(r.id)}>{r.name}{!state.discovered.includes(r.id)?" · Locked":""}</Button>)}</nav>
 {!compact&&<div className="atlas-landmark"><h2>{region.landmark}</h2><p>{state.restored.includes(region.id)?region.summary:"A quiet landmark, waiting to awaken."}</p><div>{region.connections.map(id=>{const next=REGIONS.find(r=>r.id===id)!;return <button key={id} className="quiet-link" disabled={busy||!state.discovered.includes(id)} onClick={()=>void select(id)} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>Travel to {next.name} →</button>;})}</div></div>}
 {error&&<p role="alert">{error} <button className="quiet-link" onClick={()=>void select(state.selected)}>Retry</button></p>}</Card>;
}
