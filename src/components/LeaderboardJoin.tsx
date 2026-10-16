"use client";
import {useEffect,useRef,useState} from "react";
import {Dialog} from "./Dialog";
import {useZynth} from "@/lib/store";
import {LeaderboardLocationSchema,loadLeaderboardMembership,saveLeaderboardMembership,type LeaderboardLocation,type LeaderboardMembership} from "@/lib/leaderboard-membership";
export function LeaderboardJoin({owner,onChange}:{owner:string;onChange:(value:LeaderboardMembership)=>void}){
 const [member,setMember]=useState<LeaderboardMembership|null>(null),[open,setOpen]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [choice,setChoice]=useState<"global"|"regional"|"browse">("global"),[area,setArea]=useState<LeaderboardLocation>({country:"",state:"",city:""});
 const [retry,setRetry]=useState(0);const lock=useRef(false);
 useEffect(()=>{
  let current=true;setLoading(true);setError("");
  void loadLeaderboardMembership(owner).then(value=>{if(!current)return;setMember(value);setChoice(value?.choice??"global");if(value?.choice==="regional")setArea(value.location);if(!value)setOpen(true);}).catch(()=>{if(current)setError("We couldn’t load your participation choice. Please try again.");}).finally(()=>{if(current)setLoading(false);});
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
   // Withdraw participation before any secondary preference save; joining only
   // becomes visible after both explicit choices have succeeded.
   if(choice==="browse")await saveLeaderboardMembership(owner,value);
   await useZynth.getState().updateEditableProfile({display_name:profile.display_name,character_name:profile.character_name,leaderboard_opt_out:choice==="browse"});
   if(choice!=="browse")await saveLeaderboardMembership(owner,value);
   setMember(value);setOpen(false);onChange(value);
  }catch{setError("We couldn’t save your choice. Please try again.");}
  finally{lock.current=false;setBusy(false);}
 };
 return <>
  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><span>Choose how you take part.</span><button disabled={loading} className="text-amber" onClick={()=>{setError("");setOpen(true);}}>{loading?"Loading…":member&&member.choice!=="browse"?"Manage participation":"Join leaderboard"}</button></div>
  {!open&&error&&<p role="alert" className="mt-2 text-xs text-muted">{error} <button className="text-amber" onClick={()=>setRetry(value=>value+1)}>Try again</button></p>}
  {open&&<Dialog title={member?"Your leaderboard participation":"Join the leaderboard"} onClose={()=>{if(!busy)setOpen(false);}}>
    <p>Choose how you’d like to take part. You can browse every list either way.</p>
    <fieldset disabled={busy} className="leaderboard-join-options"><legend className="sr-only">Participation</legend>
      <label><input type="radio" name="participation" checked={choice==="global"} onChange={()=>setChoice("global")}/><span>Join Global only<small>Keep your location private.</small></span></label>
      <label><input type="radio" name="participation" checked={choice==="regional"} onChange={()=>setChoice("regional")}/><span>Join all ranking lists<small>Share an approximate area for Local, State and National.</small></span></label>
      <label><input type="radio" name="participation" checked={choice==="browse"} onChange={()=>setChoice("browse")}/><span>Just browsing<small>View all lists without appearing in them.</small></span></label>
    </fieldset>
    {choice==="regional"&&<div className="leaderboard-area-fields"><p>A general area is enough. No street address, GPS or exact position is collected.</p>{(["country","state","city"] as const).map(field=><label key={field}>{field==="state"?"State / province":field==="city"?"City / general area":"Country"}<input disabled={busy} maxLength={80} autoComplete="off" value={area[field]} onChange={event=>setArea({...area,[field]:event.target.value})}/></label>)}</div>}
    {error&&<p role="alert" className="text-sm text-fail">{error}</p>}
    <div className="settings-actions"><button disabled={busy} autoFocus onClick={()=>setOpen(false)}>Decide later</button><button className="settings-save" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":choice==="browse"?"Browse only":choice==="global"?"Join Global":"Join all rankings"}</button></div>
  </Dialog>}
 </>;
}
