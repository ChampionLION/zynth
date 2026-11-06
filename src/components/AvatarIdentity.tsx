"use client";
import {useEffect,useRef,useState} from "react";
import type {Profile} from "@/lib/types";
import {AvatarSchema,DEFAULT_AVATAR,SKIN_COLORS,HAIR_COLORS,OUTFIT_COLORS,FREE_OUTFITS,equipAvatar,type Avatar} from "@/lib/avatar";
import {cachedAvatar,pendingAvatar,cacheAvatar,loadAvatar,saveAvatar} from "@/lib/avatar-db";
import {display} from "@/lib/ui";
import {Dialog} from "./Dialog";
import {AvatarArt} from "./AvatarArt";
const draftKey=(owner:string)=>`zynth:avatar-draft:${owner}`;
const label=(value:string)=>value.replaceAll("-"," ").replace(/^./,s=>s.toUpperCase());
export function AvatarIdentity({profile}:{profile:Profile}){
 const owner=profile.user_id;
 const [value,setValue]=useState<Avatar>(()=>pendingAvatar(owner)??cachedAvatar(owner)),[draft,setDraft]=useState(value);
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState("");
 const version=useRef(0),saving=useRef(false),mounted=useRef(true),editingRef=useRef(false);
 editingRef.current=editing;
 useEffect(()=>{
  mounted.current=true;const request=++version.current;
  if(!pendingAvatar(owner)&&navigator.onLine)void loadAvatar(owner).then(remote=>{if(mounted.current&&version.current===request){setValue(remote);cacheAvatar(owner,remote);if(!editingRef.current)setDraft(remote);}}).catch(()=>{/* The saved/default character remains usable. */});
  const changed=()=>setValue(pendingAvatar(owner)??cachedAvatar(owner));window.addEventListener("zynth-avatar-updated",changed);
  return()=>{mounted.current=false;window.removeEventListener("zynth-avatar-updated",changed);};
 },[owner]);
 const retry=async()=>{
  const pending=pendingAvatar(owner);if(!pending||saving.current||!navigator.onLine)return;
  saving.current=true;setBusy(true);const request=++version.current;
  try{await saveAvatar(owner,pending);if(mounted.current&&request===version.current)setStatus("Appearance saved.");}catch{if(mounted.current)setStatus("Saved. Sync pending.");}finally{saving.current=false;if(mounted.current)setBusy(false);}
 };
 useEffect(()=>{const sync=()=>void retry();void retry();window.addEventListener("online",sync);return()=>window.removeEventListener("online",sync);},[owner]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(editing)try{localStorage.setItem(draftKey(owner),JSON.stringify(draft));}catch{/* Preview remains usable. */}},[draft,editing,owner]);
 const open=()=>{
  let restored:Avatar|null=null;try{const parsed=AvatarSchema.safeParse(JSON.parse(localStorage.getItem(draftKey(owner))??"null"));if(parsed.success)restored=parsed.data;}catch{/* Open with the saved character. */}
  setDraft(restored??value);setError("");setEditing(true);
 };
 const close=()=>{if(busy)return;setEditing(false);setDraft(value);setError("");try{localStorage.removeItem(draftKey(owner));}catch{/* Cancel still discards the active preview. */}};
 const save=async()=>{
  if(saving.current)return;saving.current=true;setBusy(true);setError("");const clean=AvatarSchema.parse(draft),request=++version.current;
  const queued=cacheAvatar(owner,clean,true);
  try{
   if(navigator.onLine){try{await saveAvatar(owner,clean);if(mounted.current)setStatus("Appearance saved.");}catch{if(!queued)throw new Error("Your appearance could not be saved. Your preview is still here.");if(mounted.current)setStatus("Saved. Sync pending.");}}
   else{if(!queued)throw new Error("Device storage is full. Your preview is still here.");setStatus("Appearance saved.");}
   if(mounted.current&&request===version.current){setValue(clean);setEditing(false);try{localStorage.removeItem(draftKey(owner));}catch{/* Saved value is retained. */}}
  }catch(failure){if(mounted.current)setError(failure instanceof Error?failure.message:"Your preview is still here. Try again.");}
  finally{saving.current=false;if(mounted.current)setBusy(false);}
 };
 const stats:[string,number][]=[["Focus",profile.stats.focus],["Consistency",profile.stats.consistency],["Adaptability",profile.stats.adaptability],["Execution",profile.stats.execution],[profile.stats.stat_5.name,profile.stats.stat_5.value],[profile.stats.stat_6.name,profile.stats.stat_6.value]];
 return <>
  <section className="avatar-identity" aria-label="Your identity">
   <div className="avatar-stage"><AvatarArt value={value} name={profile.character_name||profile.display_name}/><div className="avatar-stage-label"><span>YOUR WAYFARER</span><button type="button" onClick={open}>Customize appearance ↗</button></div></div>
   <div className="avatar-identity-copy"><p className="eyebrow">STILL BECOMING</p><div className="avatar-identity-meta"><span>LEVEL {profile.level}</span><span>{profile.title}</span>{profile.prestige>0&&<span>Prestige {profile.prestige}</span>}</div><h1>{profile.character_name||profile.display_name}</h1><p className="avatar-profession">{profile.profession}</p><p className="avatar-direction">{profile.aspiration||"One deliberate step at a time."}</p><span className="avatar-domain">{label(profile.domain.toLowerCase())} · {display(profile.behavior_signature)}</span><dl className="avatar-attributes" aria-label="Your attributes">{stats.map(([name,number])=><div key={name}><dt>{display(name)}</dt><dd>{number}</dd></div>)}</dl><p className="avatar-note">Your look is yours. Your progress comes from what you learn and do.</p>{status&&<p className="settings-status" role="status">{status} {status.includes("pending")&&<button type="button" className="underline" onClick={()=>void retry()}>Retry save</button>}</p>}</div>
  </section>
  {editing&&<Dialog title="Make your Wayfarer yours." className="avatar-editor" onClose={close}><button type="button" className="avatar-editor-close" aria-label="Close appearance editor" disabled={busy} onClick={close}>×</button><p className="avatar-note">Every option here is free. Preview a change, then save when it feels right.</p><div className="avatar-editor-grid"><div className="avatar-preview"><AvatarArt value={draft} name="Appearance preview"/><p>PREVIEW</p></div><div className="avatar-options"><fieldset disabled={busy}><legend className="sr-only">Appearance choices</legend>
   <Choices name="Avatar gender" selected={draft.gender} options={["male","female"] as const} onChange={gender=>setDraft({...draft,gender})}/>
   <Swatches name="Skin tone" selected={draft.skin} colors={SKIN_COLORS} onChange={skin=>setDraft({...draft,skin})}/>
   <Choices name="Hair style" selected={draft.hair} options={["crop","waves","coils","shaved","bob","long"] as const} onChange={hair=>setDraft({...draft,hair})}/>
   <Swatches name="Hair color" selected={draft.hairColor} colors={HAIR_COLORS} onChange={hairColor=>setDraft({...draft,hairColor})}/>
   <Choices name="Outfit" selected={draft.outfit} options={FREE_OUTFITS.map(o=>o.id)} onChange={outfit=>setDraft(equipAvatar(draft,"outfit",outfit))}/>
   <Swatches name="Outfit color" selected={draft.palette} colors={OUTFIT_COLORS} onChange={palette=>setDraft({...draft,palette})}/>
   <Choices name="Backdrop" selected={draft.background} options={["atrium","grove","workshop"] as const} onChange={background=>setDraft({...draft,background})}/>
   <fieldset className="avatar-equipment"><legend>Equipment slots</legend><p><span>Outfit</span><strong>{label(draft.outfit)} · Free</strong></p><p><span>Accessory</span><strong>None equipped</strong></p><p><span>Aura</span><strong>None equipped</strong></p><button type="button" disabled>Locked · Earned equipment</button><small>Earned items are not released yet. Your accessory and aura slots are ready for inventory.</small></fieldset>
  </fieldset></div></div>{error&&<p role="alert" className="account-error">{error}</p>}<div className="avatar-editor-actions"><button type="button" disabled={busy} onClick={()=>setDraft({...DEFAULT_AVATAR})}>Reset preview</button><div><button type="button" disabled={busy} onClick={close}>Cancel</button><button type="button" className="settings-save" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save appearance"}</button></div></div></Dialog>}
 </>;
}
function Choices<T extends string>({name,selected,options,onChange}:{name:string;selected:T;options:readonly T[];onChange:(value:T)=>void}){
 return <fieldset className="avatar-choice-group"><legend>{name}</legend><div>{options.map(option=><label key={option}><input type="radio" name={`avatar-${name}`} checked={selected===option} onChange={()=>onChange(option)}/><span>{label(option)}</span></label>)}</div></fieldset>;
}
function Swatches<T extends string>({name,selected,colors,onChange}:{name:string;selected:T;colors:Record<T,string>;onChange:(value:T)=>void}){
 return <fieldset className="avatar-choice-group"><legend>{name}</legend><div className="avatar-swatches">{(Object.keys(colors) as T[]).map(option=><label key={option} title={label(option)}><input type="radio" name={`avatar-${name}`} aria-label={label(option)} checked={selected===option} onChange={()=>onChange(option)}/><span style={{background:colors[option]}}><i aria-hidden="true">{selected===option?"✓":""}</i></span></label>)}</div></fieldset>;
}
