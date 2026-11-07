"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {hasNativeFocus} from "@/lib/native-focus";
const DISMISSED="zynth:app-download-dismissed:v1";
const PAGES=new Set(["/","/dashboard","/profile","/settings","/leaderboard","/markmap","/chronicle","/achievements"]);
export function AppDownloadAlert(){
 const pathname=usePathname(),[visible,setVisible]=useState(false);
 useEffect(()=>{
  setVisible(false);if(!PAGES.has(pathname)||hasNativeFocus())return;
  try{if(localStorage.getItem(DISMISSED))return;}catch{/* Dismissal still works for this visit. */}
  const timer=setTimeout(()=>{if(!hasNativeFocus())setVisible(true);},1500);
  const nativeResume=()=>{if(hasNativeFocus())setVisible(false);};window.addEventListener("zynth-native-resume",nativeResume);
  return()=>{clearTimeout(timer);window.removeEventListener("zynth-native-resume",nativeResume);};
 },[pathname]);
 const dismiss=()=>{setVisible(false);try{localStorage.setItem(DISMISSED,"1");}catch{/* Keep the current page unobstructed. */}};
 if(!visible)return null;
 return <aside role="alert" aria-label="Android app download" className={`app-download-alert${pathname==="/"?" on-home":""}`}>
  <div><strong>Get Zynth for Android</strong><a href="/downloads/zynth-0.1.3.apk" download="Zynth-0.1.3.apk" onClick={dismiss}>Download app <span aria-hidden="true">↓</span></a></div>
  <button type="button" aria-label="Dismiss app download" onClick={dismiss}>×</button>
 </aside>;
}
