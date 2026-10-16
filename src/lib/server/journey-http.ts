import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {publicSupabaseConfig} from "../supabase";
import {accountUser} from "../auth";
import {JourneyError,RevisionConflict} from "./complete-quest";
export const journeyReply=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
export function journeyFailure(error:unknown){
 if(error instanceof JourneyError)return journeyReply({error:error.message},error.status);
 if(error instanceof RevisionConflict)return journeyReply({error:"Your journey changed. Please reopen it and retry."},409);
 return journeyReply({error:"We couldn’t update your journey. Your draft is still here. Please try again."},503);
}
export async function journeyAuth(req:NextRequest){
 const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)throw new JourneyError("Sign in required.",401);
 const {url,key}=publicSupabaseConfig();if(!url||!key)throw new JourneyError("Account access is unavailable.",503);
 const {data,error}=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}).auth.getUser(token);
 if(error||!data.user)throw new JourneyError("Sign in required.",401);
 return {user:accountUser(data.user),url};
}
export async function trustedClient(url:string):Promise<SupabaseClient>{
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(process.env.ZYNTH_TRUSTED_COMPLETION!=="1"||!secret||!["live","practice"].includes(process.env.ZYNTH_MODEL_MODE??""))throw new JourneyError("This account update is not available yet.",503);
 const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await client.from("journey_configuration").select("trusted_writes").eq("singleton",true).single();
 if(error||!data?.trusted_writes)throw new JourneyError("Your journey is being prepared. Please try again later.",503);
 return client;
}
export async function journeyBudget(client:SupabaseClient,owner:string,purpose:string,limit:number){
 const {data,error}=await client.rpc("consume_journey_budget",{p_user_id:owner,p_purpose:purpose,p_limit:limit});
 if(error)throw error;if(!data)throw new JourneyError("Please wait a minute before trying again. Your draft is safe.",429);
}
export async function journeyBody(req:NextRequest,max=100000):Promise<unknown>{
 const reader=req.body?.getReader();if(!reader)throw new JourneyError("Enter a response.",400);
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new JourneyError("That request is too long.",413);}chunks.push(part.value);}}finally{reader.releaseLock();}
 try{return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));}catch{throw new JourneyError("That request could not be read.",400);}
}
