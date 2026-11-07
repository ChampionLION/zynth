import type {Profile,Quest,Grade,StatKey} from "./types";
import {calculateSkillExpToNext} from "./engines/progression";

export const STAT_KEYS:StatKey[]=["focus","consistency","adaptability","execution","stat_5","stat_6"];
export const statValue=(p:Profile,key:StatKey)=>typeof p.stats[key]==="number"?p.stats[key] as number:(p.stats[key] as {value:number}).value;
export const statName=(p:Profile,key:StatKey)=>key==="stat_5"||key==="stat_6"?p.stats[key].name:key;
const gradeScore={Fail:0,Bad:1,Basic:2,Good:3,Excellent:4};
/** Lower mastery and recent corrections take priority; ties rotate by exposure. */
export function learningFocus(profile:Profile){
 const recent=profile.quest_history.slice(-12);
 const skills=profile.skills.map((skill,index)=>{
  const names=new Set([skill.name,...skill.evolutions??[]]);
  const entries=recent.filter(q=>q.skills_targeted.some(name=>names.has(name)));
  const struggle=entries.slice(-3).reduce((n,q)=>n+Math.max(0,3-gradeScore[q.grade]),0);
  return {name:skill.name,index,need:skill.level+skill.exp/calculateSkillExpToNext(skill.level)-struggle*.5,exposure:entries.length};
 }).sort((a,b)=>a.need-b.need||a.exposure-b.exposure||a.index-b.index);
 const stats=[...STAT_KEYS].sort((a,b)=>statValue(profile,a)-statValue(profile,b)||recent.filter(q=>q.stats_targeted?.includes(a)).length-recent.filter(q=>q.stats_targeted?.includes(b)).length);
 return {skills:skills.slice(0,2).map(s=>s.name),stats:stats.slice(0,2),stat_names:stats.slice(0,2).map(k=>statName(profile,k))};
}
const scaffolds:Record<StatKey,string>={
 focus:"Keep the goal in view: identify the one relevant fact in the example, apply its rule, then compare the result. Set aside details that do not affect that result.",
 consistency:"Use the same small routine each time: identify the given input, apply the method, and check the result. A repeatable sequence makes the next example easier to approach.",
 adaptability:"Compare the worked approach with an alternative. Name the constraint that makes one fit better, and change your approach when that constraint changes.",
 execution:"Turn the idea into a finished action: follow the worked steps in order, produce the stated result, and verify it against the requirement before moving on.",
 stat_5:"Use the domain method in the example, tracing each step from the supplied facts to its result. Check which step establishes that the result follows from the rule.",
 stat_6:"Connect the parts of the example: identify how one step's result becomes the next step's input, then check that the final outcome still meets the original requirement.",
};
export const practiceScaffold=(key:StatKey)=>scaffolds[key];
/** Stats reflect repeated successful practice, including the two domain stats. */
export function applyLearningStatPractice(profile:Profile,quest:Quest,grade:Grade,alreadyChanged:string[]):string[]{
 if(!quest.learning||!["Good","Excellent"].includes(grade))return [];
 const changed:string[]=[];
 for(const key of new Set(quest.stats_targeted??[])){
  if(!STAT_KEYS.includes(key))continue;
  const previous=new Set(profile.quest_history.filter(q=>q.learning_topics?.length&&["Good","Excellent"].includes(q.grade)&&q.stats_targeted?.includes(key)&&!q.swift_mode_used&&!q.retest_of).map(q=>q.quest_id)).size;
  if((previous+1)%3!==0||alreadyChanged.includes(key))continue;
  if(key==="stat_5"||key==="stat_6")profile.stats[key].value++;
  else profile.stats[key]++;
  changed.push(key);
 }
 return changed;
}
