"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {useRequireProfile} from "@/components/useRequireProfile";
import {useZynth} from "@/lib/store";
import {BottomNav} from "@/components/BottomNav";
import {Dialog} from "@/components/Dialog";
import {useAppearance} from "@/components/AppearanceProvider";
import {EditableProfileSchema,type EditableProfile} from "@/lib/appearance";
import type {Profile} from "@/lib/types";
import {eraseProgress} from "@/lib/db";
import {signOut as signOutAccount} from "@/lib/auth";
export default function SettingsPage(){
 const {profile,hydrated}=useRequireProfile();
 if(!hydrated||!profile)return null;
 return <SettingsForm key={profile.user_id} profile={profile}/>;
}
const editable=(p:Profile):EditableProfile=>({display_name:p.display_name,character_name:p.character_name,leaderboard_opt_out:p.leaderboard_opt_out});
const settingsDraftKey=(owner:string)=>`zynth:settings-draft:${owner}`;
function restoredFields(profile:Profile):EditableProfile{
 try{const parsed=EditableProfileSchema.safeParse(JSON.parse(localStorage.getItem(settingsDraftKey(profile.user_id))??"null"));if(parsed.success)return parsed.data;}catch{/* Browser cache is optional. */}
 return editable(profile);
}
function SettingsForm({profile}:{profile:Profile}){
 const router=useRouter(),{user,updateEditableProfile,reset}=useZynth();
 const {appearance,save:saveAppearance,retry,syncStatus,busy:appearanceBusy}=useAppearance();
 const [fields,setFields]=useState(()=>restoredFields(profile)),[saved,setSaved]=useState(()=>editable(profile));
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState("");
 const [confirmReset,setConfirmReset]=useState(false),[pendingLeave,setPendingLeave]=useState<string|null>(null);
 const lock=useRef(false),allowNavigation=useRef(false);
 const dirty=JSON.stringify(fields)!==JSON.stringify(saved);
 useEffect(()=>{try{if(dirty)localStorage.setItem(settingsDraftKey(profile.user_id),JSON.stringify(fields));else localStorage.removeItem(settingsDraftKey(profile.user_id));}catch{/* Save/discard still works without local storage. */}},[dirty,fields,profile.user_id]);
 useEffect(()=>{
   if(!dirty||allowNavigation.current)return;
   const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
   const navigate=(event:MouseEvent)=>{
     if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
     const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;
     if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
     const url=new URL(link.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
     event.preventDefault();event.stopPropagation();setPendingLeave(url.pathname+url.search+url.hash);
   };
   window.addEventListener("beforeunload",unload);document.addEventListener("click",navigate,true);
   return()=>{window.removeEventListener("beforeunload",unload);document.removeEventListener("click",navigate,true);};
 },[dirty]);
 const save=async(event:React.FormEvent)=>{
   event.preventDefault();if(lock.current)return;
   const parsed=EditableProfileSchema.safeParse({...fields,character_name:fields.character_name?.trim()||null});
   if(!parsed.success){setError(parsed.error.issues[0].message);return;}
   lock.current=true;setBusy(true);setError(null);setNotice("");
   try{await updateEditableProfile(parsed.data);setFields(parsed.data);setSaved(parsed.data);setNotice("Profile saved. Your new name follows you across Zynth.");}
   catch{setError("We couldn’t save your profile. Your edits are still here. Please try again.");}
   finally{lock.current=false;setBusy(false);}
 };
 const leave=async(target:string)=>{
   try{localStorage.removeItem(settingsDraftKey(profile.user_id));}catch{/* Leaving does not require browser storage. */}
   setFields(saved);
   if(target!=="signout"){allowNavigation.current=true;setPendingLeave(null);router.push(target);return;}
   lock.current=true;setBusy(true);setError(null);
   try{await signOutAccount();allowNavigation.current=true;reset();router.replace("/auth?mode=signin");}
   catch{setError("We couldn’t sign you out. Please try again.");}
   finally{lock.current=false;setBusy(false);setPendingLeave(null);}
 };
 const signOut=async()=>{if(lock.current)return;if(dirty)setPendingLeave("signout");else await leave("signout");};
 const erase=async()=>{
   if(!user||lock.current)return;lock.current=true;setBusy(true);setError(null);
   try{await eraseProgress(user);allowNavigation.current=true;reset();await useZynth.getState().hydrate();router.replace("/onboarding");}
   catch{setError("We couldn’t reset your progress. Please try again.");}
   finally{lock.current=false;setBusy(false);setConfirmReset(false);}
 };
 return <main className="app-page collection-page settings-page">
   <header className="workspace-header"><span>MAKE IT YOURS</span><span>ACCOUNT & APPEARANCE</span></header>
   <div className="settings-heading"><p className="eyebrow">YOUR SPACE</p><h1>Settings</h1><p>Adjust how you appear and how your world feels.</p></div>
   <div className="settings-grid"><section className="settings-panel"><p className="eyebrow">01 / IDENTITY</p><h2>A name that feels like you.</h2><p>Your display name appears throughout your journey.</p>
   <form onSubmit={save}>
     <label htmlFor="display-name">Display name</label><input id="display-name" autoComplete="nickname" required maxLength={60} value={fields.display_name} disabled={busy} onChange={e=>{setFields({...fields,display_name:e.target.value});setNotice("");}}/>
     <label htmlFor="character-name">Character name <span>optional</span></label><input id="character-name" maxLength={60} value={fields.character_name??""} disabled={busy} placeholder="Your Wayfarer’s name" onChange={e=>{setFields({...fields,character_name:e.target.value});setNotice("");}}/>
     <label className="settings-check"><input type="checkbox" checked={!fields.leaderboard_opt_out} disabled={busy} onChange={e=>setFields({...fields,leaderboard_opt_out:!e.target.checked})}/><span>Show me on the leaderboard<small>Only your first name and last initial are displayed.</small></span></label>
     <div className="settings-actions"><button type="submit" disabled={busy||!dirty} className="settings-save">{busy?"Saving…":"Save changes"}</button><button type="button" disabled={busy||!dirty} onClick={()=>{setFields(saved);setError(null);setNotice("Edits discarded.");}}>Discard</button></div>
     {dirty&&<p className="settings-status">You have unsaved changes.</p>}{notice&&<p role="status" className="settings-status">{notice}</p>}
   </form></section>
   <section className="settings-panel"><p className="eyebrow">02 / APPEARANCE</p><h2>Set the atmosphere.</h2><p>A quieter canvas, your way. Appearance never changes your progress.</p>
     <fieldset disabled={appearanceBusy}><legend>Theme</legend><div className="theme-options">{(["light","dark","system"] as const).map(theme=><label key={theme} className={`theme-choice theme-${theme}`}><input type="radio" name="theme" value={theme} checked={appearance.theme===theme} onChange={()=>void saveAppearance({...appearance,theme})}/><span className="theme-swatch" aria-hidden="true"><i/><i/></span><span>{theme==="system"?"Use device setting":`${theme[0].toUpperCase()}${theme.slice(1)}`}</span></label>)}</div></fieldset>
     <label className="settings-check"><input type="checkbox" disabled={appearanceBusy} checked={appearance.motion==="reduced"} onChange={e=>void saveAppearance({...appearance,motion:e.target.checked?"reduced":"system"})}/><span>Reduce motion<small>Your device’s reduced-motion preference is always respected.</small></span></label>
     {syncStatus&&<p role="status" className="settings-status">{syncStatus}</p>}
     {syncStatus.includes("unavailable")&&<button className="settings-retry" type="button" disabled={appearanceBusy} onClick={retry}>Retry account sync</button>}
   </section>
   <section className="settings-panel settings-account"><div><p className="eyebrow">03 / YOUR ACCOUNT</p><h2>{user?.email}</h2><p>Your saved journey stays with your account.</p></div><button disabled={busy} onClick={()=>void signOut()}>Sign out ↗</button></section>
   <details className="settings-danger"><summary>Reset progress</summary><p>This permanently removes your current profile and quests.</p><button disabled={busy} onClick={()=>setConfirmReset(true)}>Reset my progress</button></details></div>
   {error&&<p role="alert" className="settings-error">{error}</p>}
   {pendingLeave&&<Dialog title="Leave your unsaved edits?" onClose={()=>setPendingLeave(null)}><p>Your saved profile stays as it is. These edits will be discarded.</p><div className="settings-actions"><button autoFocus onClick={()=>setPendingLeave(null)}>Keep editing</button><button disabled={busy} onClick={()=>void leave(pendingLeave)}>Discard and leave</button></div></Dialog>}
   {confirmReset&&<Dialog title="Erase your entire profile?" onClose={()=>{if(!busy)setConfirmReset(false);}}><p>Level {profile.level}, {profile.quest_history.length} quests and your profile will be removed. This cannot be undone.</p><div className="settings-actions"><button autoFocus disabled={busy} onClick={()=>setConfirmReset(false)}>Keep my progress</button><button disabled={busy} onClick={()=>void erase()}>Erase progress</button></div></Dialog>}
   <BottomNav/>
 </main>;
}
