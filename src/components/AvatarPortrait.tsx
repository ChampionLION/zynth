"use client";
import {useEffect,useState} from "react";
import {cachedAvatar,pendingAvatar,cacheAvatar,loadAvatar} from "@/lib/avatar-db";
import {AvatarArt} from "./AvatarArt";
export function AvatarPortrait({owner}:{owner:string}){
 const [value,setValue]=useState(()=>pendingAvatar(owner)??cachedAvatar(owner));
 useEffect(()=>{let current=true;const refresh=()=>setValue(pendingAvatar(owner)??cachedAvatar(owner));refresh();window.addEventListener("zynth-avatar-updated",refresh);
  if(navigator.onLine&&!pendingAvatar(owner))void loadAvatar(owner).then(remote=>{if(current&&!pendingAvatar(owner))cacheAvatar(owner,remote);}).catch(()=>{});
  return()=>{current=false;window.removeEventListener("zynth-avatar-updated",refresh);};
 },[owner]);
 return <div className="avatar-portrait"><AvatarArt value={value}/></div>;
}
