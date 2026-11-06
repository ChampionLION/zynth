"use client";
import {useEffect,useState} from "react";
import {cachedAvatar,pendingAvatar,cacheAvatar,loadAvatar} from "@/lib/avatar-db";
import {AvatarArt} from "./AvatarArt";
import {useInventory} from "./useInventory";
export function AvatarPortrait({owner,picture=false,name="Your Wayfarer"}:{owner:string;picture?:boolean;name?:string}){
 const inventory=useInventory(owner);
 const [value,setValue]=useState(()=>pendingAvatar(owner)??cachedAvatar(owner));
 useEffect(()=>{let current=true;const refresh=()=>setValue(pendingAvatar(owner)??cachedAvatar(owner));refresh();window.addEventListener("zynth-avatar-updated",refresh);
  if(navigator.onLine&&!pendingAvatar(owner))void loadAvatar(owner).then(remote=>{if(current&&!pendingAvatar(owner))cacheAvatar(owner,remote);}).catch(()=>{});
  return()=>{current=false;window.removeEventListener("zynth-avatar-updated",refresh);};
 },[owner]);
 return <div className={picture?"profile-picture":"avatar-portrait"}><AvatarArt value={value} equipment={inventory?.equipment} name={name} portrait={picture}/></div>;
}
