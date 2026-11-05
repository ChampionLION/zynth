"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {readOfflinePack} from "@/lib/offline-learning";
import {authStorageKey} from "@/lib/supabase";
import {remembersSession,setRememberSession} from "@/lib/remember-session";
export function OfflineSettings({owner}:{owner:string}){
 const [remember,setRemember]=useState(true),[count,setCount]=useState(0),[notice,setNotice]=useState("");
 useEffect(()=>{const update=()=>{setRemember(remembersSession());const pack=readOfflinePack(owner);setCount(pack?.lessons.filter(q=>q.sequence>=(pack.journal.cursors[q.domain]??0)).length??0);};update();window.addEventListener("zynth-offline-updated",update);return()=>window.removeEventListener("zynth-offline-updated",update);},[owner]);
 return <section className="settings-panel"><p className="eyebrow">STAY CONNECTED TO YOUR JOURNEY</p><h2>Ready when you are.</h2><label className="settings-check"><input type="checkbox" checked={remember} onChange={event=>{try{setRememberSession(event.target.checked,authStorageKey());setRemember(event.target.checked);setNotice("Sign-in preference saved for this device.");}catch{setNotice("Your browser could not save this preference.");}}}/><span>Remember me<small>Keep your sign-in after closing Zynth. Turn off on a shared device.</small></span></label><p>{count} of 3 upcoming lessons saved. Your current quest and drafts are saved too. Reconnecting syncs your work and refills the next three.</p><div className="settings-actions"><Link className="settings-save" href="/offline">Open offline lessons →</Link><Link href="/download">Download Android app ↗</Link></div><p className="settings-status">Offline study saves your learning history. Quest rewards sync after the server confirms your answer. Sign in online once on each device to prepare it. Voice transcription may need an internet connection.</p>{notice&&<p role="status" className="settings-status">{notice}</p>}</section>;
}
