"use client";
import {useEffect,useState} from "react";
import {BrandLogo} from "@/components/BrandLogo";
import {QuestLearning} from "@/components/QuestLearning";
import {VoiceReply} from "@/components/VoiceReply";
import {cachedSessionUser} from "@/lib/supabase";
import {readOfflinePack,writeOfflinePack,cachedQuestDraft,finishStudy,queueQuest,queuedQuest,acknowledgeQueuedQuest,type OfflinePack,type StoredLesson} from "@/lib/offline-learning";
import {cacheQuestDraft} from "@/lib/db";
import {gradeLearningCheck,learningChoiceResponse,selectedLearningOption} from "@/lib/learning";
import type {Quest} from "@/lib/types";

function studyQuest(lesson:StoredLesson):Quest {
 return {id:lesson.id,quest_title:lesson.title,type:"daily",status:"active",date:"",created_at:"",description:"",difficulty:1,estimated_time:"8–12 min",skills_targeted:[],success_criteria:"",hint:"",flavor_text:"",grading_type:"reinforcement",steps:[],learning:lesson.learning};
}
export default function OfflinePage(){
 const [pack,setPack]=useState<OfflinePack|null>(null),[ready,setReady]=useState(false),[online,setOnline]=useState(true);
 const [selected,setSelected]=useState("quest"),[feedback,setFeedback]=useState("");
 useEffect(()=>{
  const update=()=>{const owner=cachedSessionUser()?.id;setPack(owner?readOfflinePack(owner):null);setReady(true);setOnline(navigator.onLine);};
  update();if(new URLSearchParams(location.search).get("lesson")==="next"){const owner=cachedSessionUser()?.id,initial=owner?readOfflinePack(owner):null;const next=initial?.lessons.find(l=>l.sequence>=(initial.journal.cursors[l.domain]??0));if(next)setSelected(next.id);}window.addEventListener("online",update);window.addEventListener("offline",update);window.addEventListener("zynth-offline-updated",update);
  return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);window.removeEventListener("zynth-offline-updated",update);};
 },[]);
 if(!ready)return <main className="account-state"><p>Opening saved lessons…</p></main>;
 if(!pack)return <main className="account-state"><BrandLogo/><h1>A little preparation, then freedom.</h1><p>Connect and sign in once to save your current quest and three upcoming lessons on this device.</p><a className="site-button" href="/auth?mode=signin">Sign in online →</a></main>;
 const cursor=pack.journal.cursors[pack.profile.domain]??0;
 const lessons=pack.lessons.filter(q=>q.domain===pack.profile.domain&&q.sequence>=cursor);
 const lesson=lessons.find(q=>q.id===selected);
 const quest=selected==="quest"?pack.quest:lesson?studyQuest(lesson):null;
 const pending=queuedQuest(pack.owner);
 return <main className="offline-page">
  <header className="offline-header"><a href="/"><BrandLogo/></a><span>{online?"ONLINE · SYNCING ENABLED":"OFFLINE · KEEP LEARNING"}</span><a href="/dashboard">Return to Overview ↗</a></header>
  <div className="offline-heading"><p className="eyebrow">YOUR JOURNEY, WITH YOU</p><h1>Keep becoming.</h1><p>{pack.profile.display_name}, your saved quest and {lessons.length} upcoming lessons are here. Reconnecting syncs your answers and saves the next three.</p><p className="settings-status">Last saved {new Date(pack.updatedAt).toLocaleString()}. Rankings and account changes need a connection.</p></div>
  <section className="offline-stats" aria-label="Saved profile stats">{[["Level",pack.profile.level],["Focus",pack.profile.stats.focus],["Consistency",pack.profile.stats.consistency],["Adaptability",pack.profile.stats.adaptability],["Execution",pack.profile.stats.execution],[pack.profile.stats.stat_5.name,pack.profile.stats.stat_5.value],[pack.profile.stats.stat_6.name,pack.profile.stats.stat_6.value]].map(([name,value])=><div key={name}><span>{name}</span><strong>{value}</strong></div>)}</section>
  {pending&&<div className="account-notice"><p role="status">Your quest answer is saved and waiting to sync. It will be submitted automatically when your account reconnects. You can keep learning below.</p><details><summary>Review saved answer</summary><pre className="whitespace-pre-wrap text-sm mt-3">{pending.responseText}</pre><button className="mt-3 text-sm underline" onClick={()=>{acknowledgeQueuedQuest(pack.owner,pending);window.dispatchEvent(new Event("zynth-offline-updated"));setFeedback("Submission removed from the sync queue. Your editable quest draft is still saved.");}}>Remove from sync queue</button></details></div>}
  <div className="offline-layout"><nav className="offline-library" aria-label="Saved lessons"><p className="eyebrow">SAVED ON THIS DEVICE</p>{pack.quest&&<button aria-pressed={selected==="quest"} onClick={()=>{setSelected("quest");setFeedback("");}}><small>CURRENT QUEST</small>{pack.quest.quest_title}</button>}{lessons.map((item,index)=><button key={item.id} aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);setFeedback("");}}><small>UPCOMING LESSON {index+1}</small>{item.title}</button>)}{!lessons.length&&<p>All three lessons are complete. Reconnect to save the next three.</p>}<p className="settings-status">These foundation lessons are additional study. Your daily quest keeps its own feedback and server-confirmed rewards.</p></nav>
   <section className="offline-workspace">{feedback&&<p role="status" className="account-notice">{feedback}</p>}{quest?<OfflineAnswer key={quest.id} pack={pack} quest={quest} lesson={lesson} onFinish={(answer)=>{
    try{
     if(lesson){const result=gradeLearningCheck(quest,answer);const next=finishStudy(readOfflinePack(pack.owner)??pack,lesson,answer);writeOfflinePack(next);setPack(next);setSelected(next.lessons.find(q=>q.sequence===(next.journal.cursors[q.domain]??0))?.id??"none");setFeedback(`Lesson saved. ${result?.feedback??"Keep the idea with you."}`);window.dispatchEvent(new Event("zynth-study-completed"));}
     else{if(pack.mode!=="trusted")throw new Error("Your draft is saved. Reconnect and open your quest to submit it.");queueQuest(pack.owner,quest.id,answer);setFeedback("Answer saved. It will sync when you reconnect.");window.dispatchEvent(new Event("zynth-study-completed"));}
    }catch(error){setFeedback(error instanceof Error?error.message:"Your answer could not be saved. Please try again.");}
   }}/>:<div className="quest-lesson"><h2>{lessons.length?"Choose your next lesson.":"A good place to pause."}</h2><p>{lessons.length?"Your next three lessons are ready in the library.":"Your work is saved. Connect again to sync and refill the next three lessons."}</p></div>}</section>
  </div>
 </main>;
}
function OfflineAnswer({pack,quest,lesson,onFinish}:{pack:OfflinePack;quest:Quest;lesson?:StoredLesson;onFinish:(answer:string)=>void}){
 const [draft,setDraft]=useState(()=>lesson?null:cachedQuestDraft(pack.owner,quest));
 const [answer,setAnswer]=useState(()=>draft?.response??""),[step,setStep]=useState(()=>draft?.current_step??0),[previous,setPrevious]=useState(()=>draft?.step_responses??[]);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const update=(response:string,stepResponses=previous,currentStep=step)=>{
  setAnswer(response);setPrevious(stepResponses);setStep(currentStep);setError("");
  try{
   if(lesson){localStorage.setItem(`zynth:study-draft:${pack.owner}:${lesson.id}`,response);}
   else{const next={response,step_responses:stepResponses,current_step:currentStep,elapsed_seconds:draft?.elapsed_seconds??0,updated_at:new Date().toISOString()};cacheQuestDraft(pack.owner,quest.id,next);setDraft(next);}
  }catch{setError("Device storage is full. Keep your answer open and free some space before leaving.");}
 };
 useEffect(()=>{if(lesson)try{setAnswer(localStorage.getItem(`zynth:study-draft:${pack.owner}:${lesson.id}`)??"");}catch{/* Typing still works. */}},[pack.owner,lesson]);
 const submit=()=>{
  if(quest.learning&&!selectedLearningOption(quest,answer)){setError("Choose an answer from the small check first.");return;}
  if(!answer.trim())return;
  if(quest.steps.length&&step<quest.steps.length-1){update("",[...previous,answer],step+1);return;}
  onFinish(quest.steps.length?[...previous,answer].map((r,i)=>`[Step ${i+1}: ${quest.steps[i].title}]\n${r}`).join("\n\n"):answer);
 };
 return <div><p className="eyebrow">{lesson?"OFFLINE STUDY":"SAVED QUEST"}</p><h2 className="text-2xl font-semibold">{quest.quest_title}</h2><p className="mt-3 text-sm text-muted">{quest.description}</p>{quest.scenario&&<div className="quest-lesson"><h3>Provided mission scenario</h3><p>{quest.scenario}</p></div>}{quest.steps.length>0&&<div className="quest-lesson"><h3>Step {step+1}: {quest.steps[step].title}</h3><p>{quest.steps[step].prompt}</p></div>}<QuestLearning quest={quest} response={answer} disabled={busy} onSelect={key=>update(learningChoiceResponse(quest,answer,key))}/><VoiceReply value={answer} onChange={update} onBusyChange={setBusy}/><label className="block mt-4 text-sm" htmlFor="offline-reply">Your answer / editable transcript</label><textarea className="offline-reply" id="offline-reply" value={answer} maxLength={lesson?1000:24000} disabled={busy} onChange={e=>update(e.target.value)} placeholder="Type an answer or add a little reasoning…"/>{error&&<p role="alert" className="account-error">{error}</p>}<button className="site-button mt-4" disabled={busy||!answer.trim()} onClick={submit}>{quest.steps.length&&step<quest.steps.length-1?"Next step →":lesson?"Finish lesson →":"Save answer to sync →"}</button>{lesson&&lesson.sequence!==(pack.journal.cursors[lesson.domain]??0)&&<p className="settings-status">You can read ahead. Complete the earlier lesson before saving this one.</p>}</div>;
}
