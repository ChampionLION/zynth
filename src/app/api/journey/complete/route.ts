import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {publicSupabaseConfig} from "@/lib/supabase";
import {completeStoredQuest,JourneyError,RevisionConflict} from "@/lib/server/complete-quest";
import {completionRepository} from "@/lib/server/completion-repository";
import {gradingPrompt} from "@/lib/llm/prompts";
import {buildCompressedContext} from "@/lib/engines/compression";
import {llmChain} from "@/lib/llm/providers";
import {GradeResultSchema} from "@/lib/llm/schemas";
import {mockGradeResponse} from "@/lib/llm/mock";
import type {GradeResult} from "@/lib/types";

export async function POST(req:NextRequest){
 const respond=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
 const {url,key}=publicSupabaseConfig();
 const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return respond({error:"Sign in required."},401);
 if(!url||!key)return respond({error:"Account access is unavailable."},503);
 try{
   const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   const {data,error}=await auth.auth.getUser(token);
   if(error||!data.user)return respond({error:"Sign in required."},401);
   // Staged boundary: enabling this alone does not harden legacy profile writes.
   // See docs/expansion/TRUSTED_PROGRESSION.md for the coordinated cutover gate.
   const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
   if(process.env.ZYNTH_TRUSTED_COMPLETION!=="1"||!secret)return respond({error:"This account update is not available yet."},503);
   if(!["live","practice"].includes(process.env.ZYNTH_MODEL_MODE??""))return respond({error:"Evaluation is not configured yet."},503);
   const reader=req.body?.getReader();if(!reader)return respond({error:"Enter a response."},400);
   const chunks:Uint8Array[]=[];let size=0;
   try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>100000){await reader.cancel();return respond({error:"Response is too long."},413);}chunks.push(part.value);}}
   finally{reader.releaseLock();}
   const raw=new TextDecoder().decode(Buffer.concat(chunks));
   let input:unknown;try{input=JSON.parse(raw);}catch{return respond({error:"Invalid response."},400);}
   const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   const result=await completeStoredQuest(data.user.id,input,completionRepository(client),async args=>{
     if(process.env.ZYNTH_MODEL_MODE==="practice")return mockGradeResponse(args);
     const prompt=gradingPrompt({questJson:JSON.stringify(args.quest),userResponse:args.response,compressedProfile:JSON.stringify(buildCompressedContext(args.profile,"grading")),strictInjection:args.strict});
     return GradeResultSchema.parse(JSON.parse(await llmChain(prompt,{maxTokens:800,expectJson:true}))) as GradeResult;
   });
   return respond(result);
 }catch(error){
   if(error instanceof JourneyError)return respond({error:error.message},error.status);
   if(error instanceof RevisionConflict)return respond({error:"Your progress changed. Please retry."},409);
   return respond({error:"Your response is still here. Evaluation is temporarily unavailable."},503);
 }
}
