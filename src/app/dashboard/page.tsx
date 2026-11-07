"use client";

// DASHBOARD — top bar, daily pop-up (energy + profiling question),
// character area, quest card, mini stats.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useZynth } from "@/lib/store";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import {AvatarPortrait} from "@/components/AvatarPortrait";
import {StreakRecovery} from "@/components/StreakRecovery";
import {Button,Chip,FlameIcon} from "@/components/ui/Atlas";
import {AttributeList,LevelStrip} from "@/components/JourneyUI";
import {rewardPreview} from "@/lib/journey-presentation";
import { DifficultyPips } from "@/components/effects";
import { display } from "@/lib/ui";
import { resolveQuestPlan, todayStr } from "@/lib/engines/quest";
import { detectUserState, STATE_PROMPT_INJECTIONS } from "@/lib/engines/adaptive";
import { generateQuest, getDailyQuestion } from "@/lib/llm/client";
import type { DailyQuestion, Quest } from "@/lib/types";
import {missionProgress,plannedQuestId} from "@/lib/engines/quest-cycle";
import {JourneyRequestError} from "@/lib/journey-client";


export default function DashboardPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const { activeQuest, createPlannedQuest, setProfile, eventQueue,gradeReveal,mode,journeyAction } = useZynth();
  const generationLock = useRef(false), dailyLock=useRef(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string|null>(null);
  const [dailyChecked, setDailyChecked] = useState(false);
  const [dailyQ, setDailyQ] = useState<DailyQuestion | null>(null);
  const [dailyBusy,setDailyBusy]=useState(false),[dailyError,setDailyError]=useState("");
  const [popupStage, setPopupStage] = useState<"energy" | "question" | "done">("done");

  // events pending? play them first
  useEffect(() => {
    if(gradeReveal)router.replace("/grade");
    else if (eventQueue.length > 0) router.replace("/events");
  }, [gradeReveal,eventQueue.length, router]);
  const questionRequest=useRef<Promise<DailyQuestion|null>|null>(null);
  const dailyQuestion=async(p:typeof profile)=>{
    if(mode!=="trusted")return p?getDailyQuestion(p):null;
    if(questionRequest.current)return questionRequest.current;
    const request=journeyAction({kind:"daily_question"}).then(result=>result.question??null);questionRequest.current=request;
    try{return await request;}finally{if(questionRequest.current===request)questionRequest.current=null;}
  };

  // Daily pop-up: energy check + profiling question, once per day
  useEffect(() => {
    if (!profile) return;
    const today = todayStr();
    if (profile.energy_date !== today) {
      setPopupStage("energy");
      setDailyChecked(true);
    } else {
      const answeredToday = profile.continuous_profile_answers.some(
        (a) => a.answered_at.slice(0, 10) === today
      );
      if (!answeredToday && profile.quest_history.length>0) {
        void dailyQuestion(profile).then((q) => {
          if (q) {
            setDailyQ(q);
            setPopupStage("question");
          } else setPopupStage("done");
          setDailyChecked(true);
        }).catch(()=>{setPopupStage("done");setDailyChecked(true);});
      } else { setPopupStage("done"); setDailyChecked(true); }
    }
  }, [profile?.energy_date, profile?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTodaysQuest = async () => {
    if (!profile || generationLock.current) return;
    const current=useZynth.getState();
    if(current.profile?.user_id!==profile.user_id||current.activeQuest||current.gradeReveal||current.eventQueue.length)return;
    if(current.profile.last_quest_date===todayStr()&&!missionProgress(current.profile).eligible)return;
    generationLock.current = true;
    setGenerationError(null);
    setGenerating(true);
    try {
    if(mode==="trusted"){await journeyAction({kind:"generate"});return;}
    // refresh adaptive state before generation
    const p = structuredClone(profile);
    const detected = detectUserState(p);
    p.current_adaptive_state = detected.state;
    const { questType, difficulty } = resolveQuestPlan(p);
    const generated = await generateQuest(
      p,
      questType,
      difficulty,
      STATE_PROMPT_INJECTIONS[detected.state]
    );
    const quest: Quest = {
      ...generated,
      id: await plannedQuestId(p.user_id,questType,missionProgress(p).cycle,questType==="mission"?missionProgress(p).attempts:p.quest_history.filter(q=>q.completed_at.slice(0,10)===todayStr()&&q.quest_type!=="mission").length,todayStr()),
      status: "active",
      created_at: new Date().toISOString(),
      date: todayStr(),
    };
    const latest = useZynth.getState().profile;
    if (!latest || latest.user_id !== p.user_id) return;
    await createPlannedQuest(quest,p.user_id);
    } catch(error) {
      const latest=useZynth.getState();
      if(latest.profile?.user_id===profile.user_id&&!latest.activeQuest&&(latest.profile.last_quest_date!==todayStr()||missionProgress(latest.profile).eligible)){
        setGenerationError(error instanceof JourneyRequestError?error.message:"We couldn’t prepare your quest. Please try again.");
      }
    } finally { generationLock.current = false; setGenerating(false); }
  };

  useEffect(()=>{setGenerationError(null);},[profile?.user_id,activeQuest?.id]);

  // auto-generate quest for today if none
  useEffect(() => {
    if (!profile || !hydrated) return;
    if (!dailyChecked || generationError || gradeReveal || eventQueue.length) return;
    const doneToday = profile.last_quest_date === todayStr();
    if (!activeQuest && (!doneToday||missionProgress(profile).eligible) && !generating) {
      void generateTodaysQuest();
    }
    // Keep unfinished challenges and their drafts, including missions after a break.
  }, [profile, hydrated, activeQuest, popupStage, dailyChecked, generationError,gradeReveal,eventQueue.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated || !profile) return null;


  const doneToday = profile.last_quest_date === todayStr();
  const mission=missionProgress(profile,activeQuest);

  const answerEnergy = async (level: "high" | "mid" | "low") => {
    if(dailyLock.current)return;dailyLock.current=true;setDailyBusy(true);setDailyError("");
    try{
      let next=profile;
      if(mode==="trusted")await journeyAction({kind:"energy",energy:level});
      else{next={...structuredClone(profile),energy_today:level,energy_date:todayStr()};await setProfile(next);}
      if(profile.quest_history.length===0){setPopupStage("done");return;}
      const q=await dailyQuestion(next);
      if(q){setDailyQ(q);setPopupStage("question");}else setPopupStage("done");
    }catch{setDailyError("We couldn't save this check-in. Please try again, or choose Not now.");}
    finally{dailyLock.current=false;setDailyBusy(false);}
  };

  const answerDaily = async (key: string | null) => {
    if(dailyLock.current)return;if(!dailyQ)return setPopupStage("done");
    dailyLock.current=true;setDailyBusy(true);setDailyError("");
    try{
      if(mode==="trusted")await journeyAction({kind:"answer_daily",answer:key});
      else{
        const p=structuredClone(profile);
        p.continuous_profile_answers.push({question:dailyQ.question,category:dailyQ.category,answer_key:key,answer_label:key?dailyQ.options.find(o=>o.key===key)?.label??null:null,signals_mined:dailyQ.signals_mined,answered_at:new Date().toISOString()});
        await setProfile(p);
      }
      setPopupStage("done");
    }catch{setDailyError("We couldn't save this answer. Please try again.");}
    finally{dailyLock.current=false;setDailyBusy(false);}
  };

  return <main className="app-page overview-v2">
   <header className="overview-hero"><div><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>Keep <em>becoming</em>, {profile.display_name.split(' ')[0]}.</h1></div><div className="streak-hook"><span aria-hidden="true"><FlameIcon size={40}/></span><div><strong>{profile.streak?`${profile.streak} days`:'A first spark.'}</strong><p>{profile.streak?'Keep your flame going.':'Start your streak today'}</p></div></div></header>
   <div className="overview-statline" aria-label="Journey statistics"><span>◈ Level {profile.level}</span><span>♨ {profile.streak} streak</span><span>✓ {profile.quest_history.length} quests</span><span>✦ {profile.cumulative_exp.toLocaleString()} EXP</span></div>
   {popupStage==='energy'&&<section className="energy-inline" aria-label="Daily energy"><span>How’s your energy?</span>{!dailyBusy&&(['low','mid','high'] as const).map((energy,i)=><Button key={energy} variant="ghost" onClick={()=>void answerEnergy(energy)}>{['Low','Okay','High'][i]}</Button>)}<Button variant="ghost" disabled={dailyBusy} onClick={()=>setPopupStage('done')}>Not now</Button>{dailyBusy&&<small role="status">Saving…</small>}</section>}
   {popupStage==='question'&&dailyQ&&profile.quest_history.length>0&&<section className="quick-question" aria-label="Daily quick question"><div><p className="eyebrow">A QUICK ONE</p><Button variant="ghost" aria-label="Dismiss quick question" disabled={dailyBusy} onClick={()=>setPopupStage('done')}>×</Button></div><h2>{dailyQ.question}</h2>{!dailyBusy&&<div>{dailyQ.options.map(o=><Button key={o.key} onClick={()=>void answerDaily(o.key)}>{o.label}</Button>)}</div>}{dailyBusy&&<small role="status">Saving…</small>}<Button variant="ghost" disabled={dailyBusy} onClick={()=>void answerDaily(null)}>Skip for now</Button></section>}
   {dailyError&&<p role="alert">{dailyError}</p>}
   <div className="overview-main-grid"><section className="overview-work">
    <div className="overview-progress"><LevelStrip profile={profile}/></div>
    <article className="today-mission" id="today-mission"><p className="eyebrow">{activeQuest?.learning?"TODAY’S LESSON":"TODAY’S MISSION"}</p>
     {doneToday&&!activeQuest&&!mission.eligible?<><h2>A mark made. A little further.</h2><p>Today’s lesson is complete. Come back when you’re ready for your next step.</p><Button onClick={()=>router.push('/markmap')}>See your mark →</Button></>:generationError&&!activeQuest?<><h2>Your next step is still here.</h2><p role="alert">{generationError}</p><Button variant="primary" onClick={()=>void generateTodaysQuest()}>Try again →</Button></>:!activeQuest?<><h2>Preparing your next chapter…</h2><div className="shimmer h-8 rounded"/><p role="status">Finding a useful place to begin.</p></>:<>
      <h2>{activeQuest.quest_title}</h2><p className="mission-summary">{activeQuest.learning?.objective??activeQuest.description}</p>
      <div className="mission-meta"><span>◷ {activeQuest.estimated_time}</span><DifficultyPips difficulty={activeQuest.difficulty}/><span className="reward-preview">{rewardPreview(profile,activeQuest)}</span></div>
      <div className="mission-skills">{activeQuest.skills_targeted.map(s=><Chip key={s}>{display(s)}</Chip>)}</div>
      <Button variant="primary" onClick={()=>router.push('/quest')}>{activeQuest.learning?'Begin lesson':'Begin mission'} →</Button><Button variant="ghost" onClick={()=>router.push('/quest?skip=1')}>Skip ({profile.tokens} tokens)</Button>
     </>}
    </article>
    {profile.quest_history.length===0&&<a className="first-mission-note" href="#today-mission"><span aria-hidden="true">↗</span><div><strong>Your first mark starts here.</strong><p>One short lesson. One useful idea. Take your first step above.</p></div></a>}
    <StreakRecovery key={profile.user_id} profile={profile}/>
   </section><aside className="overview-person"><section className="overview-avatar"><AvatarPortrait key={profile.user_id} owner={profile.user_id}/><p className="eyebrow">YOUR WAYFARER</p><h2>{profile.character_name??profile.profession}</h2><Button variant="ghost" onClick={()=>router.push('/profile')}>Your identity ↗</Button></section><AttributeList profile={profile}/><div className="resource-line"><span>◈ {profile.tokens} Skip Tokens</span><span>▱ {profile.xp_cards} XP Cards</span></div></aside></div>
   <footer className="overview-footer"><button className="quiet-link" onClick={()=>router.push('/markmap')}>Every mark matters · Explore your map →</button></footer><BottomNav/>
  </main>;
}
