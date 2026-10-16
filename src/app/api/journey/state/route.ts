import {NextRequest} from "next/server";
import {journeyAuth,trustedClient,journeyReply,journeyFailure} from "@/lib/server/journey-http";
import {journeyRepository,pendingOutcome} from "@/lib/server/journey-repository";
export async function GET(req:NextRequest){try{
 const {user,url}=await journeyAuth(req);
 if(process.env.ZYNTH_TRUSTED_COMPLETION!=="1")return journeyReply({mode:"legacy"});
 const client=await trustedClient(url),repo=journeyRepository(client);
 const [profile,activeQuest,pending]=await Promise.all([repo.profile(user.id),repo.activeQuest(user.id),pendingOutcome(client,user.id)]);
 return journeyReply({mode:"trusted",profile,activeQuest,pending});
}catch(error){return journeyFailure(error);}}
