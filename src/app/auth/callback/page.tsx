"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useZynth} from "@/lib/store";
import {resumePath} from "@/lib/account-flow";
import {isSupabaseConfigured} from "@/lib/supabase";
export default function AuthCallbackPage(){
 const router=useRouter();const[error,setError]=useState<string|null>(null);
 useEffect(()=>{let cancelled=false;void(async()=>{
   try{
     if(!isSupabaseConfigured())throw new Error("Account access is not connected yet.");
     const params=new URLSearchParams(window.location.search);
     const hash=new URLSearchParams(window.location.hash.slice(1));
     if(params.get("error")||hash.get("error"))throw new Error("This confirmation link has expired or has already been used. Please sign in or request a new link.");
     useZynth.getState().reset();await useZynth.getState().hydrate();
     if(cancelled)return;
     const state=useZynth.getState();
     if(state.hydrationError)throw new Error(state.hydrationError);
     if(!state.user)throw new Error("Please sign in to continue. If you confirmed your email in another browser, use your email and password here.");
     router.replace(resumePath(state.profile,state.activeQuest));
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:"Please sign in to continue.");}
 })();return()=>{cancelled=true;};},[router]);
 return <main className="account-state account-state-light"><span className="site-symbol">✳</span><h1>{error?"Let’s get you back in.":"Opening your next chapter."}</h1><p role={error?"alert":"status"}>{error??"Confirming your account and restoring your journey…"}</p>{error&&<Link className="site-button" href="/auth?mode=signin">Go to sign in →</Link>}</main>;
}
