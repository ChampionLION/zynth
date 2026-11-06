import {InventorySchema,EquipInput,previewEquipment,type Inventory} from "./inventory";
import {journeyRequest,JourneyRequestError} from "./journey-client";
const key=(owner:string)=>`zynth:inventory:${owner}`;
const pendingKey=(owner:string)=>`${key(owner)}:pending`;
type Intent=EquipInput&{nonce:string};
function intents(owner:string):Intent[]{try{const data=JSON.parse(localStorage.getItem(pendingKey(owner))??"[]");return Array.isArray(data)?data.filter(v=>EquipInput.safeParse({slot:v.slot,itemId:v.itemId}).success&&typeof v.nonce==="string"):[];}catch{return [];}}
function emit(){window.dispatchEvent(new Event("zynth-inventory-updated"));}
export const hasPendingEquipment=(owner:string)=>intents(owner).length>0;
export function cachedInventory(owner:string):Inventory|null{try{
 const parsed=InventorySchema.safeParse(JSON.parse(localStorage.getItem(key(owner))??"null"));
 if(!parsed.success||parsed.data.owner!==owner)return null;
 // A queued choice is a local preview only; the server still validates ownership.
 return intents(owner).reduce((value,intent)=>intent.itemId===null||value.items.some(item=>item.id===intent.itemId&&item.slot===intent.slot&&item.owned)?previewEquipment(value,intent.slot,intent.itemId):value,parsed.data);
}catch{return null;}}
function cache(owner:string,input:unknown):Inventory{
 const value=InventorySchema.parse(input);if(value.owner!==owner)throw new Error("Your account changed.");
 try{localStorage.setItem(key(owner),JSON.stringify(value));}catch{/* The returned snapshot still renders. */}emit();return value;
}
const reads=new Map<string,Promise<Inventory>>(),writes=new Map<string,Promise<void>>(),epochs=new Map<string,number>();
export async function loadInventory(owner:string):Promise<Inventory>{
 let request=reads.get(owner);if(!request){const epoch=epochs.get(owner)??0;request=journeyRequest(owner,"inventory").then(value=>(epochs.get(owner)??0)!==epoch?cachedInventory(owner)??InventorySchema.parse(value):cache(owner,value));reads.set(owner,request);}
 try{return await request;}finally{if(reads.get(owner)===request)reads.delete(owner);}
}
export async function syncInventory(owner:string):Promise<void>{
 const previous=writes.get(owner)??Promise.resolve();
 const operation=previous.catch(()=>{}).then(async()=>{
  for(const intent of intents(owner)){
   try{
    epochs.set(owner,(epochs.get(owner)??0)+1);
    const result=await journeyRequest(owner,"inventory",{slot:intent.slot,itemId:intent.itemId});
    localStorage.setItem(pendingKey(owner),JSON.stringify(intents(owner).filter(i=>i.nonce!==intent.nonce)));cache(owner,result);
   }catch(error){
    if(error instanceof JourneyRequestError&&error.status===400){localStorage.setItem(pendingKey(owner),JSON.stringify(intents(owner).filter(i=>i.nonce!==intent.nonce)));emit();}
    throw error;
   }
  }
 });writes.set(owner,operation);try{await operation;}finally{if(writes.get(owner)===operation)writes.delete(owner);}
}
export async function equipInventory(owner:string,input:EquipInput):Promise<boolean>{
 const clean=EquipInput.parse(input),snapshot=cachedInventory(owner);
 if(!snapshot||clean.itemId!==null&&!snapshot.items.some(item=>item.id===clean.itemId&&item.slot===clean.slot&&item.owned))throw new Error("This item has not been earned yet.");
 const intent={...clean,nonce:crypto.randomUUID()};
 epochs.set(owner,(epochs.get(owner)??0)+1);
 try{localStorage.setItem(pendingKey(owner),JSON.stringify([...intents(owner).filter(i=>i.slot!==clean.slot),intent]));}catch{throw new Error("Your selection could not be saved on this device.");}
 emit();if(!navigator.onLine)return false;
 try{await syncInventory(owner);return true;}catch(error){if(error instanceof JourneyRequestError&&error.status===400)throw error;return false;}
}
