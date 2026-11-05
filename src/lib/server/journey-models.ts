import type {JourneyModels} from "./journey-actions";
import {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion} from "../llm/mock";
import {OnboardingResultSchema,DailyQuestionSchema} from "../llm/schemas";
import {onboardingPrompt,questPrompt,dailyQuestionPrompt} from "../llm/prompts";
import {buildCompressedContext} from "../engines/compression";
import {STATE_PROMPT_INJECTIONS} from "../engines/adaptive";
import {llmChain} from "../llm/providers";
import type {DailyQuestion,LLMProfileResult} from "../types";
import {generatedQuest,lessonCount} from "../learning";
function json(raw:string):unknown{return JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/,"").trim());}
export const journeyModels:JourneyModels={
 classify:async answers=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{return OnboardingResultSchema.parse(json(await llmChain(onboardingPrompt(JSON.stringify(answers)),{maxTokens:1024,expectJson:true}))) as LLMProfileResult;}catch{/* Classification fallback is deterministic and does not grant progress. */}
  return mockClassifyOnboarding(answers);
 },
 generate:async(profile,type,difficulty)=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{
   const prompt=questPrompt({compressedProfile:JSON.stringify(buildCompressedContext(profile,"quest_generation")),questType:type,difficulty,adaptiveState:profile.current_adaptive_state,promptInjection:STATE_PROMPT_INJECTIONS[profile.current_adaptive_state],lessonCount:lessonCount(profile,type)});
   return generatedQuest(json(await llmChain(prompt,{maxTokens:2600,expectJson:true})),profile,type,difficulty);
  }catch{/* A failed generation retains the same plan and uses authored content. */}
  return mockGenerateQuest(profile,type,difficulty);
 },
 question:async profile=>{
  if(process.env.ZYNTH_MODEL_MODE==="live")try{return DailyQuestionSchema.parse(json(await llmChain(dailyQuestionPrompt("work_preferences",profile.continuous_profile_answers.slice(-5).map(answer=>answer.question)),{maxTokens:300,expectJson:true}))) as DailyQuestion;}catch{/* Optional questions do not block normal play. */}
  return mockDailyQuestion(profile);
 },
};
