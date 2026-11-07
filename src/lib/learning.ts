import type {GradeResult,Profile,Quest,QuestType} from "./types";
import {QuestResultSchema} from "./llm/schemas";
import {learningFocus} from "./learning-focus";

export function lessonCount(profile:Profile,type:QuestType):1|2 {
  if(type==="calibration"||type==="weakness"||["returning","burned_out","struggling"].includes(profile.current_adaptive_state)||(profile.energy_today==="low"&&profile.energy_date===new Date().toISOString().slice(0,10)))return 1;
  const completed=profile.quest_history.filter(q=>q.quest_type!=="mission"&&["Basic","Good","Excellent"].includes(q.grade)).length;
  return completed%3===1?1:2;
}

/** Validate newly generated content; historical quests remain readable as issued. */
export function generatedQuest(raw:unknown,profile:Profile,type:QuestType,difficulty:number):Omit<Quest,"id"|"status"|"created_at"|"date"> {
  const result=QuestResultSchema.parse(raw);
  const asksForInventedProblem=/(?:^|[.!?\n]\s*)(?:invent|create|choose|pick|come up with)\s+(?:(?:a|an|your|one|new|own)\s+){0,3}(?:problem|scenario|test case)\b/i;
  const skills=new Set(profile.skills.map(s=>s.name));
  if(result.skills_targeted.some(name=>!skills.has(name)))throw new Error("Target existing skills from the learner's profile.");
  if(type==="mission"){
    if(!result.scenario||result.steps.length<2||result.steps.length>3||result.learning)throw new Error("A mission needs a provided case and two or three solution steps.");
    if(result.steps.some((s,i)=>s.step_number!==i+1||!s.prompt.trim()||!s.success_criteria.trim()))throw new Error("A mission needs ordered, answerable steps.");
    if(result.steps.some(s=>asksForInventedProblem.test(s.prompt)))throw new Error("Supply the problem instead of asking the learner to invent one.");
    const taught=new Set(profile.quest_history.filter(q=>q.quest_type!=="mission"&&["Basic","Good","Excellent"].includes(q.grade)).slice(-7).flatMap(q=>q.learning_topics??[]));
    if(result.assessment_topics?.some(topic=>!taught.has(topic)))throw new Error("Assess recorded taught topics, or supply a reference for legacy learning.");
  }else if(!result.learning||result.learning.lessons.length!==lessonCount(profile,type)||result.steps.length)throw new Error("Teach the planned short lessons before a single reinforcement check.");
  else if(asksForInventedProblem.test(result.learning.check.question))throw new Error("Supply the reinforcement problem.");
  if(type!=="mission"){
    const focus=learningFocus(profile);
    if(focus.skills.length&&!result.skills_targeted.includes(focus.skills[0]))throw new Error("Teach the priority skill rather than repeating only strengths.");
    if(!result.stats_targeted?.includes(focus.stats[0]))throw new Error("Build practice around the priority attribute.");
  }
  return {...result,type,difficulty};
}

export function selectedLearningOption(quest:Pick<Quest,"learning">,response:string):string|null {
  const check=quest.learning?.check;if(!check)return null;
  const text=response.trim();
  const key=text.match(/^(?:choice|option|answer)\s+([A-C])\b/i)?.[1]??text.match(/^([A-C])(?:[.):]|$)/i)?.[1];
  if(key&&check.options.some(o=>o.key===key.toUpperCase()))return key.toUpperCase();
  return check.options.find(o=>o.label.toLowerCase()===text.toLowerCase())?.key??null;
}

export function learningChoiceResponse(quest:Quest,response:string,key:string):string {
 const option=quest.learning?.check.options.find(o=>o.key===key);if(!option)return response;
 const previous=selectedLearningOption(quest,response),label=quest.learning?.check.options.find(o=>o.key===previous)?.label;
 let reason=response.trim();
 if(previous){
   const prefix=`Choice ${previous}: ${label}`;
   if(reason.startsWith(prefix))reason=reason.slice(prefix.length).trim();
   else if(label&&reason.toLowerCase()===label.toLowerCase())reason="";
   else reason=reason.replace(/^(?:(?:choice|option|answer)\s+)?[A-C](?:[.):]|\s|$)\s*/i,"").trim();
 }
 return `Choice ${key}: ${option.label}${reason?`\n${reason}`:""}`;
}

/** A small formative check gives corrective feedback, never a prose-length score. */
export function gradeLearningCheck(quest:Quest,response:string):GradeResult|null {
  if(!quest.learning)return null;
  const selected=selectedLearningOption(quest,response);
  if(!selected)throw new Error("Choose an option, or start your reply with Option A, Option B or Option C.");
  const check=quest.learning.check,correct=selected===check.correct_option;
  const selectedLabel=check.options.find(o=>o.key===selected)!.label;
  const answer=check.options.find(o=>o.key===check.correct_option)!.label;
  return {
    grade:correct?"Good":"Basic",
    feedback:`You chose “${selectedLabel}”. ${correct?"That applies the lesson correctly.":`The better fit is “${answer}”.`} ${check.explanation}`,
    mentor_line:correct?"A small idea, put to work.":"A correction is part of learning. Take this principle into your next quest.",
    strengths:correct?["Applied the taught concept to the provided problem"]:["Made an attempt at the practice check"],
    improvements:correct?[]:[check.explanation],
    behavioral_signals:{response_depth:"adequate",domain_relevance:correct?"high":"medium",difficulty_handled:correct?"met":"struggled",completion_quality:correct?"strong":"adequate"},
    skill_progress:quest.skills_targeted.map(name=>({name,exp_signal:correct?"medium":"low"})),
    hidden_quest_triggered:false,skill_evolution_signal:null,
  };
}
