import {supabase} from "./supabase";
import type {JourneyAction,JourneyActionResult,JourneyState} from "./journey-contract";
import type {CompletionResponse} from "./server/complete-quest";
const modes=new Map<string,"legacy"|"trusted">();
export class JourneyRequestError extends Error{constructor(message:string,public status:number){super(message);}}
export function trustedJourney(owner:string){return modes.get(owner)==="trusted";}
export async function journeyRequest<T>(owner:string,path:string,input?:unknown):Promise<T>{
 const {data:{session},error}=await supabase().auth.getSession();
 if(error||!session||session.user.id!==owner)throw new Error("Please sign in again.");
 const response=await fetch(`/api/journey/${path}`,{method:input===undefined?"GET":"POST",cache:"no-store",signal:AbortSignal.timeout(55000),headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},...(input===undefined?{}:{body:JSON.stringify(input)})});
 const value=await response.json();
 if(!response.ok)throw new JourneyRequestError(typeof value.error==="string"?value.error:"We couldn’t update your journey. Please try again.",response.status);
 const latest=await supabase().auth.getSession();if(latest.data.session?.user.id!==owner)throw new Error("Your account changed. Please sign in again.");
 return value as T;
}
export async function readJourneyState(owner:string):Promise<JourneyState>{
 const state=await journeyRequest<JourneyState>(owner,"state");
 if(state.mode!=="legacy"&&state.mode!=="trusted")throw new Error("Your journey configuration could not be read.");
 if(state.profile&&state.profile.user_id!==owner)throw new Error("Please sign in again.");
 modes.set(owner,state.mode);return state;
}
export const sendJourneyAction=(owner:string,action:JourneyAction)=>journeyRequest<JourneyActionResult>(owner,"action",action);
export const sendCompletion=(owner:string,questId:string,responseText:string)=>journeyRequest<CompletionResponse>(owner,"complete",{questId,responseText});
