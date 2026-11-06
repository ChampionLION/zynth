"use client";
import {useEffect,useState} from "react";
import {cachedInventory,loadInventory,syncInventory} from "@/lib/inventory-client";
export function useInventory(owner:string){
 const [inventory,setInventory]=useState(()=>cachedInventory(owner));
 useEffect(()=>{
  let current=true;const changed=()=>{if(current)setInventory(cachedInventory(owner));};
  const refresh=()=>{if(navigator.onLine)void syncInventory(owner).then(()=>loadInventory(owner)).then(value=>{if(current)setInventory(cachedInventory(owner)??value);}).catch(()=>{});};
  changed();refresh();window.addEventListener("zynth-inventory-updated",changed);window.addEventListener("online",refresh);
  return()=>{current=false;window.removeEventListener("zynth-inventory-updated",changed);window.removeEventListener("online",refresh);};
 },[owner]);
 return inventory;
}
