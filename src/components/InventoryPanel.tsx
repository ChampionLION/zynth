"use client";
import {useState} from "react";
import type {Avatar} from "@/lib/avatar";
import {previewEquipment,type Inventory,type CosmeticSlot} from "@/lib/inventory";
import {equipInventory,loadInventory,hasPendingEquipment} from "@/lib/inventory-client";
import {AvatarArt} from "./AvatarArt";
import {Toast} from "./ui/Atlas";
export function InventoryPanel({owner,appearance,inventory}:{owner:string;appearance:Avatar;inventory:Inventory|null}){
 const [category,setCategory]=useState<"all"|CosmeticSlot>("all"),[filter,setFilter]=useState("all"),[selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const items=inventory?.items.filter(item=>(category==="all"||item.slot===category)&&(filter==="all"||filter==="owned"&&item.owned||filter==="locked"&&!item.owned||filter==="equipped"&&item.equipped))??[];
 const item=items.find(item=>item.id===selected)??items[0];
 const act=async(remove=false)=>{if(!item||busy)return;setBusy(true);setError("");try{
  const saved=await equipInventory(owner,{slot:item.slot,itemId:remove?null:item.id});setMessage(saved?(remove?"Item removed.":"Appearance updated."):"Selection saved. Sync pending.");
 }catch(error){setError(error instanceof Error?error.message:"Your selection could not be saved.");}finally{setBusy(false);}};
 const refresh=async()=>{setBusy(true);setError("");try{await loadInventory(owner);setMessage("Inventory refreshed.");}catch{setError("Your inventory could not be refreshed. Your saved items are still here.");}finally{setBusy(false);}};
 return <section id="inventory" className="cosmetic-inventory" aria-label="Cosmetic inventory">
  <header><div><p className="eyebrow">COLLECTED ALONG THE WAY</p><h2>Your inventory</h2></div><button type="button" disabled={busy} onClick={()=>void refresh()} data-disabled-reason={busy?"Please wait…":"Not available yet"}>Refresh inventory</button></header>
  <div className="inventory-filters"><fieldset><legend>Category</legend>{([['all','All items'],['outfit','Outfits'],['accessory','Accessories'],['aura','Auras']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</fieldset><fieldset><legend>Show</legend>{['all','owned','locked','equipped'].map(id=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{id[0].toUpperCase()+id.slice(1)}</button>)}</fieldset></div>
  {!inventory?<p className="avatar-note">Loading inventory...</p>:<div className="inventory-layout"><div className="inventory-cards">{items.length===0?<p>No items match these filters.</p>:items.map(entry=><button type="button" key={entry.id} className="inventory-card" aria-pressed={entry.id===item?.id} onClick={()=>setSelected(entry.id)}><span className={`inventory-item-mark slot-${entry.slot}`} aria-hidden="true">{entry.slot==='outfit'?'♜':entry.slot==='accessory'?'◇':'◎'}</span><span><small>{entry.slot} · {entry.rarity}</small><strong>{entry.name}</strong><em>{entry.equipped?'Equipped':entry.owned?'Owned':'Locked'}</em></span></button>)}</div>{item&&<div className="inventory-preview"><AvatarArt value={appearance} equipment={previewEquipment(inventory,item.slot,item.id).equipment} name={`${item.name} preview`}/><small>{item.owned?'YOUR COLLECTION':'TRY IT ON'}</small><h3>{item.name}</h3><p>{item.description}</p><p className="avatar-note">{item.requirement}</p><div className="inventory-actions"><button type="button" className="settings-save" disabled={busy||!item.owned||item.equipped} onClick={()=>void act()} data-disabled-reason={busy?"Please wait…":"Not available yet"}>{busy?'Saving…':item.equipped?'Equipped':item.owned?'Equip item':'Not earned yet'}</button>{item.equipped&&<button type="button" disabled={busy} onClick={()=>void act(true)} data-disabled-reason={busy?"Please wait…":"Not available yet"}>Remove item</button>}</div></div>}</div>}
  {message&&<Toast>{message.includes("Sync pending.")&&!hasPendingEquipment(owner)?"Appearance updated.":message}</Toast>}{error&&<Toast tone="error">{error}</Toast>}
 </section>;
}
