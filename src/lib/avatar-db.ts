import {supabase,publicSupabaseConfig,cachedSessionUser} from "./supabase";
import {AvatarSchema,parseAvatar,type Avatar} from "./avatar";
const key=(owner:string)=>`zynth:avatar:${owner}`;
export function cachedAvatar(owner:string):Avatar{try{const cached=JSON.parse(localStorage.getItem(key(owner))??"null"),user=cachedSessionUser();return parseAvatar(cached??(user?.id===owner?user.user_metadata?.zynth_avatar:null));}catch{return parseAvatar(null);}}
export function pendingAvatar(owner:string):Avatar|null{try{const parsed=AvatarSchema.safeParse(JSON.parse(localStorage.getItem(`${key(owner)}:pending`)??"null"));return parsed.success?parsed.data:null;}catch{return null;}}
export function cacheAvatar(owner:string,value:Avatar,pending=false):boolean{try{localStorage.setItem(key(owner),JSON.stringify(AvatarSchema.parse(value)));if(pending)localStorage.setItem(`${key(owner)}:pending`,JSON.stringify(value));window.dispatchEvent(new Event("zynth-avatar-updated"));return true;}catch{return false;}}
export async function loadAvatar(owner:string):Promise<Avatar>{
 const {data,error}=await supabase().auth.getUser();if(error||data.user?.id!==owner)throw new Error("Your appearance could not be loaded.");
 return parseAvatar(data.user.user_metadata.zynth_avatar);
}
const saves=new Map<string,Promise<void>>();
export async function saveAvatar(owner:string,input:Avatar):Promise<void>{
 const clean=AvatarSchema.parse(input),previous=saves.get(owner)??Promise.resolve();
 const operation=previous.catch(()=>{}).then(()=>writeAvatar(owner,clean));saves.set(owner,operation);
 try{await operation;}finally{if(saves.get(owner)===operation)saves.delete(owner);}
}
async function writeAvatar(owner:string,input:Avatar):Promise<void>{
 const clean=AvatarSchema.parse(input),{data:{session},error}=await supabase().auth.getSession();
 if(error||session?.user.id!==owner)throw new Error("Sign in again to save your appearance.");
 const {url,key:publicKey}=publicSupabaseConfig();
 // Freeze the bearer token: an account switch cannot redirect A's write to B.
 const response=await fetch(`${url}/auth/v1/user`,{method:"PUT",cache:"no-store",signal:AbortSignal.timeout(20000),headers:{apikey:publicKey,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({data:{zynth_avatar:clean}})});
 const result=await response.json();if(!response.ok||result.id!==owner)throw new Error("Your appearance could not be saved.");
 if(cachedSessionUser()?.id!==owner)throw new Error("Your account changed.");
 const pending=pendingAvatar(owner);
 if(pending&&JSON.stringify(pending)!==JSON.stringify(clean))return;
 if(pending)try{localStorage.removeItem(`${key(owner)}:pending`);}catch{/* Cloud save is confirmed. */}
 cacheAvatar(owner,clean);
}
