"use client";
import {useInventory} from "./useInventory";
export function EarnedCosmetics({owner,questId}:{owner:string;questId:string}){
 const inventory=useInventory(owner);let before:string[]|null=null;
 try{const parsed=JSON.parse(localStorage.getItem(`zynth:inventory-before:${owner}:${questId}`)??'null');if(Array.isArray(parsed)&&parsed.every(v=>typeof v==='string'))before=parsed;}catch{}
 if(!before||!inventory||inventory.owner!==owner)return null;
 const earned=inventory.items.filter(item=>item.owned&&!before!.includes(item.id));
 return earned.length?<div className="earned-chips" aria-label="New in your inventory">{earned.map(item=><span key={item.id}>✦ {item.name}</span>)}</div>:null;
}
