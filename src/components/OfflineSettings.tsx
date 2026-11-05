"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {authStorageKey} from "@/lib/supabase";
import {remembersSession,setRememberSession} from "@/lib/remember-session";
export function OfflineSettings({owner}:{owner:string}){
 const [remember,setRemember]=useState(true),[notice,setNotice]=useState("");
 useEffect(()=>setRemember(remembersSession()),[owner]);
 return <section className="settings-panel"><p className="eyebrow">YOUR ACCOUNT</p><h2>Ready when you are.</h2><label className="settings-check"><input type="checkbox" checked={remember} onChange={event=>{try{setRememberSession(event.target.checked,authStorageKey());setRemember(event.target.checked);setNotice("Sign-in preference saved.");}catch{setNotice("Your browser could not save this preference.");}}}/><span>Remember me<small>Keep your sign-in after closing Zynth. Turn off on a shared device.</small></span></label><div className="settings-actions"><Link href="/download">Download Android app ↗</Link></div>{notice&&<p role="status" className="settings-status">{notice}</p>}</section>;
}
