import assert from "node:assert/strict";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest,mockGradeResponse} from "./src/lib/llm/mock";
import {generatedQuest,gradeLearningCheck,learningChoiceResponse,lessonCount,selectedLearningOption} from "./src/lib/learning";
import {QuestLearningSchema,QuestResultSchema} from "./src/lib/llm/schemas";
import {runExploitCheck} from "./src/lib/engines/exploit";
import {buildCompressedContext} from "./src/lib/engines/compression";
import {questPrompt} from "./src/lib/llm/prompts";
import type {Domain,Profile,Quest,QuestType} from "./src/lib/types";

const base=buildProfile("00000000-0000-4000-8000-000000000021","Mira",mockClassifyOnboarding({Q1:["Software developer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]}));
const asQuest=(content:ReturnType<typeof mockGenerateQuest>):Quest=>({...content,id:crypto.randomUUID(),created_at:new Date().toISOString(),date:new Date().toISOString().slice(0,10),status:"active"});
for(const domain of ["TECHNICAL","CREATIVE","ANALYTICAL","SOCIAL","STRATEGIC"] as Domain[]){
 const p:Profile={...structuredClone(base),domain};const titles=new Set<string>(),counts=new Set<number>();
 for(let day=0;day<7;day++){
  const type=day===0?"calibration":"daily",content=mockGenerateQuest(p,type,2),q=asQuest(content);
  const parsed=QuestResultSchema.safeParse(content);assert.ok(parsed.success,`${domain} day ${day}: ${parsed.success?"":parsed.error.message}`);assert.ok(QuestLearningSchema.safeParse(content.learning).success);
  assert.equal(content.learning!.lessons.length,lessonCount(p,type));assert.equal(content.steps.length,0);
  assert.doesNotThrow(()=>generatedQuest(content,p,type,2));titles.add(q.quest_title);counts.add(q.learning!.lessons.length);
  const correct=q.learning!.check.correct_option,wrong=q.learning!.check.options.find(o=>o.key!==correct)!.key;
  assert.equal(gradeLearningCheck(q,`Option ${correct}`)!.grade,"Good","Concise correct choices do not need essay padding");
  const feedback=gradeLearningCheck(q,`Option ${wrong}`)!;assert.equal(feedback.grade,"Basic");assert.ok(feedback.feedback.includes(q.learning!.check.explanation));
  assert.throws(()=>gradeLearningCheck(q,"An unrelated answer"),/Choose an option/);
  assert.equal(mockGradeResponse({quest:q,response:`Option ${correct}`,profile:p,responseTimeSeconds:3}).grade,"Good");
  assert.equal(runExploitCheck({quest:q,profile:p,response:`Option ${correct}`,responseTimeSeconds:3}).severity,null);
  p.quest_history.push({quest_id:q.id,quest_title:q.quest_title,quest_type:type,grade:"Good",exp_earned:0,skills_targeted:q.skills_targeted,completed_at:new Date().toISOString(),response:`Option ${correct}`,learning_topics:q.learning!.lessons.map(l=>l.title)});
 }
 assert.equal(titles.size,7,"The first seven learning quests should introduce different topics");assert.deepEqual([...counts].sort(),[1,2]);
 const mission=mockGenerateQuest(p,"mission",3);assert.ok(mission.scenario&&mission.scenario.length>80);assert.equal(mission.steps.length,3);assert.equal(mission.learning,undefined);
 assert.ok(mission.assessment_topics?.length);assert.ok(mission.assessment_topics!.every(t=>p.quest_history.some(q=>q.learning_topics?.includes(t))));
 assert.doesNotThrow(()=>generatedQuest(mission,p,"mission",3));
 assert.throws(()=>generatedQuest({...mission,scenario:undefined},p,"mission",3),/provided case/);
 assert.throws(()=>generatedQuest({...mission,steps:mission.steps.map((s,i)=>i===0?{...s,prompt:"Invent your own problem and solve it."}:s)},p,"mission",3),/Supply the problem/);
 assert.throws(()=>generatedQuest({...mission,assessment_topics:["An untaught topic"]},p,"mission",3),/recorded taught/);
 const context=buildCompressedContext(p,"quest_generation").recent_learning as {topics:string[]}[];assert.ok(context.every(q=>q.topics.length>0));
}
for(const type of ["daily","weakness","challenge","hidden","prestige","calibration"] as QuestType[]){
 const content=mockGenerateQuest(base,type,3);assert.ok(content.learning);assert.equal(content.steps.length,0);
 assert.throws(()=>generatedQuest({...content,learning:undefined},base,type,3),/Teach/);
 assert.throws(()=>generatedQuest({...content,steps:[{step_number:1,title:"write",prompt:"answer every lesson",estimated_time:"1 min",success_criteria:"write"}]},base,type,3),/Teach/);
}
assert.equal(lessonCount({...base,current_adaptive_state:"returning"},"daily"),1);
const quiz=asQuest(mockGenerateQuest(base,"daily",1)),a=quiz.learning!.check.options[0],b=quiz.learning!.check.options[1];
const prior=learningChoiceResponse(quiz,"My reasoning stays here.",a.key);
assert.ok(learningChoiceResponse(quiz,prior,b.key).endsWith("\nMy reasoning stays here."));
assert.equal(selectedLearningOption(quiz,`option ${b.key.toLowerCase()} because the example uses it`),b.key);
assert.equal(selectedLearningOption(quiz,b.label),b.key);
assert.equal(selectedLearningOption(quiz,"A different answer with the word B"),null);
assert.equal(runExploitCheck({profile:base,response:"short",responseTimeSeconds:3}).severity,"soft_block","Legacy free-response rules remain intact");
assert.equal(gradeLearningCheck({...quiz,learning:undefined},"Legacy prose"),null);
const invalid=structuredClone(quiz.learning!);invalid.check.options[1].key=invalid.check.options[0].key;assert.equal(QuestLearningSchema.safeParse(invalid).success,false);
const prompt=questPrompt({compressedProfile:"{}",questType:"daily",difficulty:1,adaptiveState:"optimal",promptInjection:"",lessonCount:2});
assert.ok(prompt.includes("exactly 2 short lessons")&&prompt.includes("no separate grade"));
const missionPrompt=questPrompt({compressedProfile:"{}",questType:"mission",difficulty:2,adaptiveState:"optimal",promptInjection:""});
assert.ok(missionPrompt.includes("Never ask them to invent a problem")&&missionPrompt.includes("test inputs"));
console.log("Learning-first quests passed: 35 authored lessons/checks across five domains, one/two-lesson cadence, provided mission cases, concise corrective grading, response preservation, schema guards, context history and legacy rules.");
