import type {JourneyModels} from "./journey-actions";
import {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion} from "../llm/mock";
import {OnboardingResultSchema,QuestResultSchema,DailyQuestionSchema} from "../llm/schemas";
import {onboardingPrompt,questPrompt,dailyQuestionPrompt} from "../llm/prompts";
import {buildCompressedContext} from "../engines/compression";
import {STATE_PROMPT_INJECTIONS} from "../engines/adaptive";
import {llmChain} from "../llm/providers";
import type {DailyQuestion,LLMProfileResult} from "../types";
function json(raw:string):unknown{return JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/,"").trim());}
export const journeyModels:JourneyModels={
 classify:async answers=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{return OnboardingResultSchema.parse(json(await llmChain(onboardingPrompt(JSON.stringify(answers)),{maxTokens:1024,expectJson:true}))) as LLMProfileResult;}catch{/* Classification fallback is deterministic and does not grant progress. */}
  return mockClassifyOnboarding(answers);
 },
 generate:async(profile,type,difficulty)=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{
   const prompt=questPrompt({compressedProfile:JSON.stringify(buildCompressedContext(profile,"quest_generation")),questType:type,difficulty,adaptiveState:profile.current_adaptive_state,promptInjection:STATE_PROMPT_INJECTIONS[profile.current_adaptive_state]});
   const generated=QuestResultSchema.parse(json(await llmChain(prompt,{maxTokens:1400,expectJson:true})));
   if((type==="mission"||type==="prestige")&&(generated.steps.length<2||generated.steps.length>3))throw new Error("A mission needs linked steps");
   return {...generated,type,difficulty,steps:type==="mission"||type==="prestige"?generated.steps:[]};
  }catch{/* A failed generation retains the same plan and uses authored content. */}
  return mockGenerateQuest(profile,type,difficulty);
 },
 question:async profile=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{return DailyQuestionSchema.parse(json(await llmChain(dailyQuestionPrompt("work_preferences",profile.continuous_profile_answers.slice(-5).map(answer=>answer.question)),{maxTokens:300,expectJson:true}))) as DailyQuestion;}catch{/* Optional questions do not block normal play. */}
  return mockDailyQuestion(profile);
 },
};
