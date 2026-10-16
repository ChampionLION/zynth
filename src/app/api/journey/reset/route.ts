import {NextRequest} from "next/server";
import {journeyAuth,trustedClient,journeyReply,journeyFailure,journeyBody,journeyBudget} from "@/lib/server/journey-http";
import {JourneyError} from "@/lib/server/complete-quest";
import {z} from "zod";
const resetInput=z.object({confirmation:z.literal("reset-my-progress"),requestId:z.string().uuid()}).strict();
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),input=await journeyBody(req);
 const parsed=resetInput.safeParse(input);if(!parsed.success)throw new JourneyError("Confirm the reset in Settings.",400);
 await journeyBudget(client,user.id,"reset",2);
 const {error}=await client.rpc("reset_journey",{p_user_id:user.id,p_request_id:parsed.data.requestId});if(error)throw error;
 return journeyReply({ok:true});
}catch(error){return journeyFailure(error);}}
