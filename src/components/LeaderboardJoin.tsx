"use client";
import {useEffect,useRef,useState} from "react";
import {Dialog} from "./Dialog";
import {useZynth} from "@/lib/store";
import Link from "next/link";
import {LeaderboardLocationSchema,loadLeaderboardMembership,saveLeaderboardMembership,type LeaderboardLocation,type LeaderboardMembership} from "@/lib/leaderboard-membership";
export function LeaderboardJoin({owner,onChange}:{owner:string;onChange:(value:LeaderboardMembership)=>void}){
 const [member,setMember]=useState<LeaderboardMembership|null>(null),[open,setOpen]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [choice,setChoice]=useState<"global"|"regional">("global"),[area,setArea]=useState<LeaderboardLocation>({country:"",state:"",city:""});
 const [retry,setRetry]=useState(0);const lock=useRef(false);
 useEffect(()=>{
  let current=true;setLoading(true);setError("");
  void loadLeaderboardMembership(owner).then(value=>{if(!current)return;setMember(value);setChoice(value?.choice==="regional"?"regional":"global");if(value?.choice==="regional")setArea(value.location);if(!value)setOpen(true);}).catch(()=>{if(current)setError("We couldn’t load your regional choice. Please try again.");}).finally(()=>{if(current)setLoading(false);});
  return()=>{current=false;};
 },[owner,retry]);
 const save=async()=>{
  if(lock.current)return;
  const location=choice==="regional"?LeaderboardLocationSchema.safeParse(area):null;
  if(location&&!location.success){setError(location.error.issues[0].message);return;}
  const value:LeaderboardMembership=choice==="regional"?{version:1,choice,location:location!.data!}:{version:1,choice,location:null};
  lock.current=true;setBusy(true);setError("");
  try{
   const profile=useZynth.getState().profile;if(!profile||profile.user_id!==owner)throw new Error("Please sign in again.");
   // Settings owns public visibility. Regional changes never silently toggle it.
   await saveLeaderboardMembership(owner,value);
   setMember(value);setOpen(false);onChange(value);
  }catch{setError("We couldn’t save your choice. Please try again.");}
  finally{lock.current=false;setBusy(false);}
 };
 return <>
  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><Link className="text-amber" href="/settings">Settings</Link><button disabled={loading} className="text-amber" onClick={()=>{setError("");setOpen(true);}} data-disabled-reason={loading?"Please wait…":"Requirements not met"}>{loading?"Loading…":member?.choice==="regional"?"Manage regions":"Regions"}</button></div>
  {!open&&error&&<p role="alert" className="mt-2 text-xs text-muted">{error} <button className="text-amber" onClick={()=>setRetry(value=>value+1)}>Try again</button></p>}
  {open&&<Dialog title="Regional rankings" onClose={()=>{if(!busy)setOpen(false);}}>

    <fieldset disabled={busy} className="leaderboard-join-options"><legend className="sr-only">Participation</legend>
      <label><input type="radio" name="participation" checked={choice==="global"} onChange={()=>setChoice("global")}/><span>Global only<small>Keep your location private.</small></span></label>
      <label><input type="radio" name="participation" checked={choice==="regional"} onChange={()=>setChoice("regional")}/><span>Join regional rankings<small>Share an approximate area for Local, State and National.</small></span></label>
    </fieldset>
    {choice==="regional"&&<div className="leaderboard-area-fields">{(["country","state","city"] as const).map(field=><label key={field}>{field==="state"?"State / province":field==="city"?"City / general area":"Country"}<input disabled={busy} maxLength={80} autoComplete="off" value={area[field]} onChange={event=>setArea({...area,[field]:event.target.value})}/></label>)}</div>}
    {error&&<p role="alert" className="text-sm text-fail">{error}</p>}

    <div className="settings-actions"><button disabled={busy} autoFocus onClick={()=>setOpen(false)} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>Decide later</button><button className="settings-save" disabled={busy} onClick={()=>void save()} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>{busy?"Saving…":choice==="global"?"Keep Global only":"Save regional choice"}</button></div>
  </Dialog>}
 </>;
}
