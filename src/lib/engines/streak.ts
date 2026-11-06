import type {Profile} from "../types";
import {spendToken} from "./economy";
import {writeMilestone} from "./memory";
import {todayStr} from "./quest";

const DAY=86_400_000;
const distance=(a:string,b:string)=>Math.round((Date.parse(b)-Date.parse(a))/DAY);
export function streakGapCovered(profile:Profile,from:string,to:string):boolean {
 return profile.memory.milestones.some(m=>m.type==="streak_restored"&&typeof m.from==="string"&&typeof m.through==="string"&&m.from<=from&&distance(m.through,to)<=1);
}
export interface StreakRecovery {gap:string;from:string;through:string;cost:number;streak:number}
function uncoveredDays(profile:Profile,from:string,to:string):number {
 const start=Date.parse(from)+DAY,end=Date.parse(to)-DAY;
 const ranges=profile.memory.milestones.filter(m=>m.type==="streak_restored"&&typeof m.from==="string"&&typeof m.through==="string")
  .map(m=>[Math.max(start,Date.parse(m.from as string)+DAY),Math.min(end,Date.parse(m.through as string))])
  .filter(([a,b])=>a<=b).sort((a,b)=>a[0]-b[0]);
 let covered=0,cursor=start;
 for(const [a,b] of ranges){const first=Math.max(a,cursor);if(first<=b){covered+=(b-first)/DAY+1;cursor=b+DAY;}}
 return Math.max(0,distance(from,to)-1-covered);
}
/** Only real successful days count. Skips and purchased bridges preserve continuity. */
export function streakRecovery(profile:Profile,today=todayStr()):StreakRecovery|null {
 const successes=new Set(profile.quest_history.filter(q=>q.grade!=="Fail").map(q=>q.completed_at.slice(0,10)).filter(d=>d<=today));
 const dates=[...new Set([...successes,...profile.memory.milestones.filter(m=>m.type==="quest_skipped").map(m=>m.date.slice(0,10)).filter(d=>d<=today)])].sort();
 if(!dates.length||!successes.size)return null;
 let count=0,previous:string|null=null,latest:StreakRecovery|null=null;
 for(const date of dates){
  if(previous&&distance(previous,date)>1&&!streakGapCovered(profile,previous,date)){
   // Offer one break at a time, starting with the newest uncovered gap.
   latest=count>0?{gap:`${previous}:${date}`,from:previous,through:new Date(Date.parse(date)-DAY).toISOString().slice(0,10),cost:uncoveredDays(profile,previous,date),streak:count}:null;
   count=0;
  }
  if(successes.has(date))count++;
  previous=date;
 }
 if(previous&&distance(previous,today)>1&&!streakGapCovered(profile,previous,today)){
  return count>0?{gap:`${previous}:${today}`,from:previous,through:new Date(Date.parse(today)-DAY).toISOString().slice(0,10),cost:uncoveredDays(profile,previous,today),streak:count}:null;
 }
 return latest?{...latest,streak:latest.streak+count}:null;
}
export function restoreStreak(profile:Profile,gap:string,today=todayStr()):void {
 const recovery=streakRecovery(profile,today);
 if(!recovery||recovery.gap!==gap)throw new Error("Your streak changed. Reopen recovery and try again.");
 if(!spendToken(profile,recovery.cost))throw new Error(`You need ${recovery.cost} Skip Token${recovery.cost===1?"":"s"} to restore this streak.`);
 profile.streak=recovery.streak;
 profile.streak_best=Math.max(profile.streak_best,profile.streak);
 profile.memory.personal_bests.highest_streak=Math.max(profile.memory.personal_bests.highest_streak,profile.streak);
 writeMilestone(profile,"streak_restored",{from:recovery.from,through:recovery.through,cost:recovery.cost,streak:recovery.streak});
}
