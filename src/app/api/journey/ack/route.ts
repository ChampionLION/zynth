import {NextRequest} from "next/server";
import {z} from "zod";
import {journeyAuth,trustedClient,journeyReply,journeyFailure,journeyBody} from "@/lib/server/journey-http";
import {JourneyError} from "@/lib/server/complete-quest";
const input=z.object({questId:z.string().uuid(),grade:z.boolean(),cursor:z.number().int().nonnegative()}).strict();
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),parsed=input.safeParse(await journeyBody(req));
 if(!parsed.success)throw new JourneyError("That acknowledgement is not valid.",400);
 const {error}=await client.rpc("ack_journey_outcome",{p_user_id:user.id,p_quest_id:parsed.data.questId,p_grade:parsed.data.grade,p_cursor:parsed.data.cursor});if(error)throw error;
 return journeyReply({ok:true});
}catch(error){return journeyFailure(error);}}
