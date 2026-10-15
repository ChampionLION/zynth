"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {isSupabaseConfigured,supabase} from "@/lib/supabase";
import {friendlyAuthError} from "@/lib/auth";
import {useZynth} from "@/lib/store";
import {resumePath} from "@/lib/account-flow";
export default function ResetPasswordPage(){
 const router=useRouter();const[ready,setReady]=useState(false),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{let cancelled=false;void(async()=>{
   if(!isSupabaseConfigured()){setError("Account access is not connected yet.");return;}
   try {
   const {data,error}=await supabase().auth.getSession();
   if(cancelled)return;
   if(error||!data.session)setError("This reset link has expired. Please request another one from sign in.");else setReady(true);
   }catch(e){if(!cancelled)setError(friendlyAuthError(e));}
 })();return()=>{cancelled=true;};},[]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;if(password!==confirm){setError("The two passwords don’t match.");return;}setBusy(true);setError(null);try{const {error}=await supabase().auth.updateUser({password});if(error)throw error;await useZynth.getState().hydrate();const s=useZynth.getState();router.replace(resumePath(s.profile,s.activeQuest));}catch(e){setError(friendlyAuthError(e));}finally{setBusy(false);}};
 return <main className="account-state account-state-light"><Link className="site-wordmark" href="/"><span className="site-symbol">✳</span>ZYNTH</Link><section className="account-card"><h1>A fresh password.</h1><p className="account-card-description">Your journey stays right where it is.</p>{error&&<p className="account-error" role="alert">{error}</p>}{ready&&<form onSubmit={submit}><div className="account-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></div><div className="account-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div><button className="site-button account-submit" disabled={busy}>{busy?"Saving…":"Save password →"}</button></form>}<Link className="account-back-link" href="/auth?mode=signin">Back to sign in</Link></section></main>;
}
