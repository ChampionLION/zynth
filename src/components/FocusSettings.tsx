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
 return <section className="settings-panel focus-settings" aria-labelledby="focus-title"><p className="eyebrow">03 / A MOMENT TO BECOME</p><h2 id="focus-title">Make time for your next step.</h2><p>Choose a daily quest time. On Android, Zynth can bring your quest over other apps for three minutes, or until your reply is successfully submitted.</p>
 {!native?<p className="settings-status">Open the Zynth Android app to set your alarm and allow the quest overlay. Alarms belong to that device; this browser cannot display over other apps.</p>:<>
 {!state?.overlayAllowed&&<div className="focus-permission-callout"><strong>First, allow quest overlays.</strong><p>Android needs your permission to bring a quest over other apps. Tap below, allow Zynth on the Android screen, then return here to choose your time. Prefer reminders? Allow notifications instead. You can change either permission at any time.</p><button type="button" className="settings-save" disabled={busy||!state} onClick={()=>void perform("permission",{kind:"overlay"})}>Allow quest overlays</button></div>}
 <form onSubmit={event=>{event.preventDefault();void perform("saveSchedule",{owner,time,enabled,reminderMinutes},enabled?"Daily quest time saved on this device.":"Daily quest alarm turned off.");}}>
  <label htmlFor="quest-focus-time">Daily quest time <span>device local time</span></label><input id="quest-focus-time" type="time" required value={time} disabled={busy||!state} onChange={event=>{setTime(event.target.value);setNotice("");}}/>
  <label className="settings-check"><input type="checkbox" checked={enabled} disabled={busy||!state} onChange={event=>{setEnabled(event.target.checked);setNotice("");}}/><span>Enable daily quest focus<small>With permission, your quest appears for three minutes or until submitted. Otherwise, allowed notifications remind you instead. An emergency exit and Android’s controls remain available.</small></span></label>
  <label htmlFor="quest-reminder-interval">Repeat notifications <span>when overlays are unavailable</span></label><select id="quest-reminder-interval" value={reminderMinutes} disabled={busy||!state} onChange={event=>setReminderMinutes(Number(event.target.value))}>{[5,10,15].map(minutes=><option key={minutes} value={minutes}>Every {minutes} minutes</option>)}</select><p className="settings-status">Reminders run for up to 30 minutes. Submitting a quest or choosing “Pause today” on a notification stops the repeats.</p>
  <div className="focus-permissions" aria-label="Quest alarm permissions">{([{kind:"notifications",label:"Notifications",allowed:state?.notificationsAllowed},{kind:"overlay",label:"Display over other apps",allowed:state?.overlayAllowed},{kind:"exact",label:"Precise alarm time",allowed:state?.exactAllowed}] as const).map(item=><div key={item.kind}><span>{item.label}<small>{item.allowed?"Allowed":"Needs permission"}</small></span><button type="button" disabled={busy} onClick={()=>void perform("permission",{kind:item.kind})}>{item.allowed?"Review":"Allow"}</button></div>)}</div>
  {state&&(!state.overlayAllowed||!state.exactAllowed)&&<p className="settings-status">Without both overlay and precise alarm access, Zynth sends repeat notifications if allowed. Android battery settings may delay reminders beyond your chosen interval.</p>}
  <div className="settings-actions"><button className="settings-save" type="submit" disabled={busy||!state}>{busy?"Saving…":"Save quest time"}</button><button type="button" disabled={busy||!state?.overlayAllowed} onClick={()=>void perform("preview",{},"Focus opened. Use Emergency exit to end the preview.")}>Try focus now</button></div>
  {state?.enabled&&state.nextAt&&<p className="settings-status">Next: {new Date(state.nextAt).toLocaleString(undefined,{weekday:"short",hour:"numeric",minute:"2-digit"})}. Reopen Zynth after force-stopping it to resume alarms.</p>}
 </form>
 {notice&&<p className="settings-status" role="status">{notice}</p>}{error&&<p className="settings-error" role="alert">{error}</p>}
 </>}
 </section>;
}
