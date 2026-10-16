import {supabase,isSupabaseConfigured} from "./supabase";
import {AppearanceSchema,parseAppearance,type Appearance} from "./appearance";
const key=(owner:string)=>`zynth:appearance:${owner}`;
const pendingKey=(owner:string)=>`${key(owner)}:pending`;
export function cachedAppearance(owner:string):Appearance{try{return parseAppearance(JSON.parse(localStorage.getItem(key(owner))??"null"));}catch{return parseAppearance(null);}}
export function cacheAppearance(owner:string,value:Appearance):void{try{localStorage.setItem(key(owner),JSON.stringify(value));}catch{/* Active tab can still use its theme. */}}
export function pendingAppearance(owner:string):Appearance|null{try{const value=AppearanceSchema.safeParse(JSON.parse(localStorage.getItem(pendingKey(owner))??"null"));return value.success?value.data:null;}catch{return null;}}
export function queueAppearance(owner:string,value:Appearance):boolean{try{localStorage.setItem(key(owner),JSON.stringify(value));localStorage.setItem(pendingKey(owner),JSON.stringify(value));return true;}catch{return false;}}
export function acknowledgeAppearance(owner:string,value:Appearance):void{try{if(JSON.stringify(pendingAppearance(owner))===JSON.stringify(value))localStorage.removeItem(pendingKey(owner));}catch{/* A later sync can retry. */}}
export async function loadAppearance(owner:string):Promise<Appearance|null>{
 if(!isSupabaseConfigured())return null;
 const {data,error}=await supabase().from("user_preferences").select("theme,motion").eq("user_id",owner).maybeSingle();
 if(error)throw error;return data?AppearanceSchema.parse(data):null;
}
export async function saveAppearance(owner:string,value:Appearance):Promise<void>{
 const clean=AppearanceSchema.parse(value);if(!isSupabaseConfigured())throw new Error("Account sync is unavailable.");
 const {error}=await supabase().from("user_preferences").upsert({user_id:owner,...clean,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)throw error;
}
