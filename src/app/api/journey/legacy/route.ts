import {NextRequest} from "next/server";
import {journeyAuth,trustedClient,journeyReply,journeyFailure} from "@/lib/server/journey-http";
export async function GET(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url);
 const {data,error}=await client.from("journey_legacy_snapshots").select("snapshot,created_at").eq("user_id",user.id).eq("source","browser_archive").maybeSingle();if(error)throw error;
 return journeyReply({snapshot:data??null});
}catch(error){return journeyFailure(error);}}
