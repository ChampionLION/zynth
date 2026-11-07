import type {Profile,Quest,Grade} from "../types";
export const EXTRA_LESSON_EXP=2;
export function learnedLessonsToday(profile:Pick<Profile,"quest_history">,day:string):number{
 return new Set(profile.quest_history.filter(q=>q.quest_type!=="mission"&&q.learning_topics?.length&&["Basic","Good","Excellent"].includes(q.grade)&&q.completed_at.slice(0,10)===day&&!q.swift_mode_used&&!q.retest_of).map(q=>q.quest_id)).size;
}
export function lessonRewards(profile:Pick<Profile,"quest_history">,quest:Pick<Quest,"type"|"learning">,grade:Grade,day:string){
 if(!quest.learning||quest.type==="mission"||!["Basic","Good","Excellent"].includes(grade))return {bonusExp:0,skipTokens:0};
 const extra=learnedLessonsToday(profile,day);
 return {bonusExp:extra>0?EXTRA_LESSON_EXP:0,skipTokens:extra>0&&extra%2===0?1:0};
}
