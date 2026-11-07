"use client";
import {useCallback,useEffect,useState} from "react";
import {hasNativeFocus,nativeFocusRequest,type NativeFocusState} from "@/lib/native-focus";

export function FocusSettings({owner}:{owner:string}){
 const [state,setState]=useState<NativeFocusState|null>(null),[native,setNative]=useState(false),[time,setTime]=useState("18:00"),[enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const [reminderMinutes,setReminderMinutes]=useState(5);
 const refresh=useCallback(async()=>{
  if(!hasNativeFocus())return;setNative(true);
  try{const value=await nativeFocusRequest("getState");setState(value);setError("");}catch(e){setError(e instanceof Error?e.message:"Could not read device settings.");}
 },[]);
 useEffect(()=>{
  let current=true;
  if(hasNativeFocus()){
   setNative(true);void nativeFocusRequest("bindOwner",{owner}).then(value=>{if(current){setState(value);setTime(value.time);setEnabled(value.enabled);setReminderMinutes(value.reminderMinutes);}}).catch(e=>{if(current)setError(e instanceof Error?e.message:"Could not read device settings.");});
  }
  const resume=()=>{void refresh();};window.addEventListener("zynth-native-resume",resume);window.addEventListener("focus",resume);
  return()=>{current=false;window.removeEventListener("zynth-native-resume",resume);window.removeEventListener("focus",resume);};
 },[owner,refresh]);
 const perform=async(command:string,data:Record<string,unknown>,message="")=>{
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{const result=await nativeFocusRequest(command,data);setState(result);if(command==="saveSchedule"){setEnabled(result.enabled);setTime(result.time);setReminderMinutes(result.reminderMinutes);}setNotice(message);}
  catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
 };
 return <section className="settings-panel focus-settings" aria-labelledby="focus-title"><p className="eyebrow">03 / A MOMENT TO BECOME</p><h2 id="focus-title">Daily reminders</h2>
 {!native?<a className="quiet-link" href="/download">Get the Android app</a>:<>
 {!state?.overlayAllowed&&<div className="focus-permission-callout"><strong>First, allow quest overlays.</strong><p>Allow Zynth to show your quest over other apps, or use notifications.</p><button type="button" className="settings-save" disabled={busy||!state} onClick={()=>void perform("permission",{kind:"overlay"})} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>Allow quest overlays</button></div>}
 <form onSubmit={event=>{event.preventDefault();void perform("saveSchedule",{owner,time,enabled,reminderMinutes},enabled?"Daily quest time saved on this device.":"Daily quest alarm turned off.");}}>
  <label htmlFor="quest-focus-time">Daily quest time <span>device local time</span></label><input id="quest-focus-time" type="time" required value={time} disabled={busy||!state} onChange={event=>{setTime(event.target.value);setNotice("");}}/>
  <label className="settings-check"><input type="checkbox" checked={enabled} disabled={busy||!state} onChange={event=>{setEnabled(event.target.checked);setNotice("");}}/><span>Enable daily quest focus</span></label>
  <label htmlFor="quest-reminder-interval">Repeat notifications <span>when overlays are unavailable</span></label><select id="quest-reminder-interval" value={reminderMinutes} disabled={busy||!state} onChange={event=>setReminderMinutes(Number(event.target.value))}>{[5,10,15].map(minutes=><option key={minutes} value={minutes}>Every {minutes} minutes</option>)}</select>
  <div className="focus-permissions" aria-label="Quest alarm permissions">{([{kind:"notifications",label:"Notifications",allowed:state?.notificationsAllowed},{kind:"overlay",label:"Display over other apps",allowed:state?.overlayAllowed},{kind:"exact",label:"Precise alarm time",allowed:state?.exactAllowed}] as const).map(item=><div key={item.kind}><span>{item.label}<small>{item.allowed?"Allowed":"Needs permission"}</small></span><button type="button" disabled={busy} onClick={()=>void perform("permission",{kind:item.kind})} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>{item.allowed?"Review":"Allow"}</button></div>)}</div>

  <div className="settings-actions"><button className="settings-save" type="submit" disabled={busy||!state} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>{busy?"Saving…":"Save quest time"}</button><button type="button" disabled={busy||!state?.overlayAllowed} onClick={()=>void perform("preview",{},"Focus opened. Use Emergency exit to end the preview.")} data-disabled-reason={busy?"Please wait…":"Requirements not met"}>Try focus now</button></div>
  {state?.enabled&&state.nextAt&&<p className="settings-status">Next: {new Date(state.nextAt).toLocaleString(undefined,{weekday:"short",hour:"numeric",minute:"2-digit"})}. Reopen Zynth after force-stopping it to resume alarms.</p>}
 </form>
 {notice&&<p className="settings-status" role="status">{notice}</p>}{error&&<p className="settings-error" role="alert">{error}</p>}
 </>}
 </section>;
}
