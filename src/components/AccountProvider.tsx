"use client";
import {useEffect} from "react";
import {ZynthMark} from "@/components/BrandLogo";
import {usePathname,useRouter} from "next/navigation";
import {useZynth} from "@/lib/store";
import {isSupabaseConfigured,supabase} from "@/lib/supabase";
const protectedRoutes=["/dashboard","/quest","/markmap","/chronicle","/leaderboard","/profile","/settings","/onboarding","/reveal","/grade","/events","/achievements","/prestige"];
export function AccountProvider({children}:{children:React.ReactNode}) {
 const router=useRouter(),pathname=usePathname();
 const {user,profile,activeQuest,gradeReveal,pendingOutcome,hydrated,loading,hydrationError,hydrate}=useZynth();
 const protectedPage=protectedRoutes.some(p=>pathname===p||pathname.startsWith(p+"/"));
 useEffect(()=>{
   void hydrate();
   if(!isSupabaseConfigured())return;
   let disposed=false;
   const {data:{subscription}}=supabase().auth.onAuthStateChange((event,session)=>{
     const state=useZynth.getState();
     if(event==="SIGNED_OUT" || (session?.user.id && session.user.id!==state.user?.id)) {
       state.reset();
       // Do not await Supabase calls inside its auth-state callback.
       setTimeout(()=>{if(!disposed)void useZynth.getState().hydrate();},0);
     }
   });
   return()=>{disposed=true;subscription.unsubscribe();};
 },[hydrate]);
 useEffect(()=>{
   if(!protectedPage||!hydrated||loading||hydrationError)return;
   if(!user)router.replace("/auth?mode=signin");
   else if(!profile && pathname!=="/onboarding")router.replace("/onboarding");
   else if(profile&&gradeReveal&&pathname!=="/grade")router.replace("/grade");
   else if(profile&&!gradeReveal&&pendingOutcome?.gradeSeen&&pendingOutcome.eventCursor<pendingOutcome.result.events.length&&pathname!=="/events")router.replace("/events");
 },[protectedPage,hydrated,loading,hydrationError,user,profile,activeQuest,gradeReveal,pendingOutcome,pathname,router]);
 if(protectedPage && hydrationError)return <main className="account-state"><ZynthMark className="account-brand-mark"/><h1>Your journey is still yours.</h1><p role="alert">{hydrationError}</p><button onClick={()=>void hydrate()}>Try again →</button></main>;
 if(protectedPage && (!hydrated||loading||!user||(!profile&&pathname!=="/onboarding")))return <main className="account-state"><ZynthMark className="account-brand-mark"/><p role="status">Opening your journey…</p></main>;
 return <>{children}</>;
}
