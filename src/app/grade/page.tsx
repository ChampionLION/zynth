"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useZynth} from "@/lib/store";
import {CountUp} from "@/components/effects";
import {Button,Chip} from "@/components/ui/Atlas";
import {EarnedCosmetics} from "@/components/EarnedCosmetics";
import {ShareButton} from "@/components/JourneyUI";
const encouragement={Fail:'Needs work',Bad:'Needs work',Basic:'Getting there',Good:'Strong',Excellent:'Excellent'};
export default function GradeRevealPage(){
 const router=useRouter(),{gradeReveal,eventQueue,ackGrade,profile,pendingOutcome}=useZynth(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!gradeReveal&&profile)router.replace('/dashboard');},[gradeReveal,profile,router]);
 if(!gradeReveal||!profile)return null;
 const{gradeResult,expEarned,streakMultiplier,changedStats}=gradeReveal,completed=pendingOutcome?profile.quest_history.find(q=>q.quest_id===pendingOutcome.questId):profile.quest_history.at(-1),practice=!!completed?.learning_topics?.length;
 const cont=async()=>{if(busy)return;setBusy(true);setError('');try{await ackGrade();router.replace(eventQueue.length?'/events':'/dashboard');}catch{setError('Your progress is saved. Please try continuing again.');setBusy(false);}};
 return <main className="lesson-feedback"><div className="reward-atmosphere" aria-hidden="true"/><section className="feedback-card"><p className="eyebrow">{practice?'A LESSON, TAKEN WITH YOU':'A STEP IN YOUR CRAFT'}</p><span className="feedback-symbol" aria-hidden="true">{gradeResult.grade==='Excellent'?'✦':gradeResult.grade==='Good'?'✧':'↗'}</span><h1>{encouragement[gradeResult.grade]}</h1><p className="feedback-mentor">{gradeResult.mentor_line}</p><p className="feedback-reading">{gradeResult.feedback}</p><div className="feedback-exp"><CountUp to={expEarned} prefix="+" suffix=" EXP"/>{streakMultiplier>1&&<Chip kind="progress">{streakMultiplier}× streak</Chip>}</div><div className="mission-skills">{changedStats.map(stat=><Chip key={stat}>↑ {stat}</Chip>)}{gradeResult.strengths.map(s=><Chip key={s}>{s}</Chip>)}</div>{completed&&<EarnedCosmetics key={profile.user_id+completed.quest_id} owner={profile.user_id} questId={completed.quest_id}/>}<aside className="improve-next"><p className="eyebrow">WHAT TO IMPROVE NEXT</p><p>{gradeResult.improvements[0]??gradeResult.mentor_line}</p></aside><div className="feedback-actions"><Button variant="primary" disabled={busy} disabledReason="Saving your place…" onClick={()=>void cont()}>Continue learning →</Button>{['Good','Excellent'].includes(gradeResult.grade)&&<ShareButton title={`${encouragement[gradeResult.grade]} · ${completed?.quest_title??'A new mark'}`} lines={[`+${expEarned} EXP`,...changedStats.map(s=>`${s} growing`)]}/>}</div>{error&&<p role="alert">{error}</p>}</section></main>;
}
