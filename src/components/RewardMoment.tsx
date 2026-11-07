"use client";
import {useEffect,useState} from "react";
import {useReducedMotion} from "framer-motion";
import {useAppearance} from "./AppearanceProvider";
import {AvatarPortrait} from "./AvatarPortrait";
import {ShareButton} from "./JourneyUI";
import {EarnedCosmetics} from "./EarnedCosmetics";
import {Button,LockIcon,FlameIcon} from "./ui/Atlas";
import {LEVEL_UNLOCKS} from "@/lib/engines/progression";
import type {ZynthEvent} from "@/lib/types";
import {useZynth} from "@/lib/store";
function copy(event:ZynthEvent){switch(event.kind){
 case 'level_up':{const next=Object.keys(LEVEL_UNLOCKS).map(Number).sort((a,b)=>a-b).find(n=>n>event.to);return {label:'LEVEL UP',hero:String(event.to),title:`Level ${event.to}${event.newTitle?` · ${event.newTitle}`:''}`,before:`Level ${event.from}`,next:next?`${LEVEL_UNLOCKS[next]} unlocks at Level ${next}.`:'A new level. More room to become.',rewards:event.unlocks};}
 case 'skill_evolution':return {label:'SKILL EVOLUTION',hero:'✧',before:event.oldName,title:event.newName,next:`Tier ${event.tier} · Take this skill into your next quest.`,rewards:[event.skill]};
 case 'hidden_skill':return {label:'A HIDDEN STRENGTH',hero:'⌑',before:'Waiting to be discovered',title:event.skill,next:event.message,rewards:['New skill discovered']};
 case 'streak_milestone':{const next=[7,14,30,60,100].find(n=>n>event.streak);return {label:'MOMENTUM, MADE VISIBLE',hero:'♨',before:'One deliberate day at a time',title:`${event.streak} days. A brighter flame.`,next:next?`Your next streak milestone is ${next} days.`:'Keep becoming, one day at a time.',rewards:event.tokenAwarded?['+1 Skip Token']:[]};}
 case 'weakness_overcome':return {label:'A PATTERN CHANGED',hero:'↗',before:event.oldSignature,title:event.newSignature,next:`Keep practising ${event.stat}. A different approach is taking root.`,rewards:[`${event.stat} growing`]};
 case 'achievement':return {label:'AN ACHIEVEMENT EARNED',hero:'✦',before:event.rarity,title:event.name,next:'A new mark in your achievement collection.',rewards:event.cards?[`+${event.cards} XP Cards`]:[]};
 case 'profession_evolution':return {label:'YOUR DIRECTION EVOLVES',hero:'◈',before:event.from,title:event.to,next:'Bring your growing craft into your next challenge.',rewards:['Profession evolved']};
}}
export function RewardMoment({event,onContinue,busy,error}:{event:ZynthEvent;onContinue:()=>void;busy:boolean;error:string}){
 const profile=useZynth(s=>s.profile),pending=useZynth(s=>s.pendingOutcome),pref=useAppearance(),reduce=useReducedMotion(),quiet=reduce||pref.appearance.motion==='reduced';
 const [stage,setStage]=useState(quiet?3:0),[sound,setSound]=useState(false),[haptics,setHaptics]=useState(false);
 const data=copy(event);
 useEffect(()=>{try{setSound(localStorage.getItem('zynth:reward-sound')==='yes');setHaptics(localStorage.getItem('zynth:reward-haptics')==='yes');}catch{}},[]);
 useEffect(()=>{if(quiet){setStage(3);return;}const a=setTimeout(()=>setStage(1),1200),b=setTimeout(()=>setStage(2),1800),c=setTimeout(()=>setStage(3),2400);return()=>{clearTimeout(a);clearTimeout(b);clearTimeout(c);};},[quiet]);
 useEffect(()=>{if(haptics&&stage===1)navigator.vibrate?.([35,50,35]);},[haptics,stage]);
 const chime=()=>{try{const audio=new AudioContext(),gain=audio.createGain();gain.connect(audio.destination);gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.7);[392,494,587].forEach((freq,i)=>{const oscillator=audio.createOscillator();oscillator.frequency.value=freq;oscillator.connect(gain);oscillator.start(audio.currentTime+i*.08);oscillator.stop(audio.currentTime+.7);});setTimeout(()=>void audio.close(),850);}catch{}};
 useEffect(()=>{if(sound)chime();},[sound]); // eslint-disable-line react-hooks/exhaustive-deps
 const exp=pending?.result.expEarned??0;
 return <main className={`reward-moment reward-${event.kind} ${quiet?'reward-static':''}`}><div className="reward-atmosphere" aria-hidden="true"/><div className="reward-options"><button aria-pressed={sound} onClick={()=>{setSound(!sound);try{localStorage.setItem('zynth:reward-sound',!sound?'yes':'no');}catch{}}}>{sound?'♪ Sound on':'♪ Sound off'}</button>{typeof navigator!=='undefined'&&'vibrate'in navigator&&<button aria-pressed={haptics} onClick={()=>{setHaptics(!haptics);try{localStorage.setItem('zynth:reward-haptics',!haptics?'yes':'no');}catch{}if(!haptics)navigator.vibrate?.(35);}}>Haptics {haptics?'on':'off'}</button>}</div><section className="reward-story"><p className="eyebrow">{data.label}</p><div className="reward-hero" aria-hidden="true"><i className="reward-ring"/><i className="reward-ring second"/>{event.kind==='skill_evolution'&&<span className="old-skill-badge">◇</span>}<span className="reward-symbol">{event.kind==='hidden_skill'?<LockIcon size={72} unlocked/>:event.kind==='streak_milestone'?<FlameIcon size={100}/>:data.hero}</span>{profile&&event.kind==='level_up'&&<div className="reward-wayfarer"><AvatarPortrait owner={profile.user_id}/></div>}</div><div className="reward-changes" aria-live="polite">{stage>=1&&<><p className="reward-before">{data.before}</p><h1>{data.title}</h1></>}{stage>=2&&<><div className="earned-chips">{exp>0&&<span>+{exp} EXP</span>}{data.rewards.map(reward=><span key={reward}>{reward}</span>)}</div>{profile&&pending&&<EarnedCosmetics key={profile.user_id+pending.questId} owner={profile.user_id} questId={pending.questId}/>}<p className="reward-next">{data.next}</p></>}</div><div className="reward-continue">{stage>=3?<><Button variant="primary" disabled={busy} disabledReason="Saving your place…" onClick={onContinue}>Continue →</Button><ShareButton title={data.title} lines={[data.label,...data.rewards,exp>0?`+${exp} EXP`:'Keep becoming.']}/></>:<button className="quiet-link" onClick={()=>setStage(3)}>Skip animation →</button>}</div>{error&&<p role="alert">{error}</p>}</section></main>;
}
