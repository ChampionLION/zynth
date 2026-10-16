import {NextRequest} from "next/server";
import {completeStoredQuest} from "@/lib/server/complete-quest";
import {completionRepository} from "@/lib/server/completion-repository";
import {journeyAuth,trustedClient,journeyReply,journeyFailure,journeyBody,journeyBudget} from "@/lib/server/journey-http";
import {gradingPrompt} from "@/lib/llm/prompts";
import {buildCompressedContext} from "@/lib/engines/compression";
import {llmChain} from "@/lib/llm/providers";
import {GradeResultSchema} from "@/lib/llm/schemas";
import {mockGradeResponse} from "@/lib/llm/mock";
import type {GradeResult} from "@/lib/types";
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),input=await journeyBody(req);
 await journeyBudget(client,user.id,"completion",6);
 const result=await completeStoredQuest(user.id,input,completionRepository(client),async args=>{
  if(process.env.ZYNTH_MODEL_MODE==="practice")return mockGradeResponse(args);
  const prompt=gradingPrompt({questJson:JSON.stringify(args.quest),userResponse:args.response,compressedProfile:JSON.stringify(buildCompressedContext(args.profile,"grading")),strictInjection:args.strict});
  const raw=await llmChain(prompt,{maxTokens:800,expectJson:true});
  return GradeResultSchema.parse(JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/,""))) as GradeResult;
 });
 return journeyReply(result);
}catch(error){return journeyFailure(error);}}
