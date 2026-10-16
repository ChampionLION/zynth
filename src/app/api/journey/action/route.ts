import {NextRequest} from "next/server";
import {journeyAuth,trustedClient,journeyReply,journeyFailure,journeyBody,journeyBudget} from "@/lib/server/journey-http";
import {journeyRepository} from "@/lib/server/journey-repository";
import {runJourneyAction} from "@/lib/server/journey-actions";
import {journeyModels} from "@/lib/server/journey-models";
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url);
 const input=await journeyBody(req,300000);
 await journeyBudget(client,user.id,"actions",30);
 if(input&&typeof input==="object"&&"kind" in input&&["onboard","generate","daily_question"].includes(String(input.kind)))await journeyBudget(client,user.id,"models",6);
 return journeyReply(await runJourneyAction(user,input,journeyRepository(client),journeyModels));
}catch(error){return journeyFailure(error);}}
