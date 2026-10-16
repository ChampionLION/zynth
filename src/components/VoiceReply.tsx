"use client";
import {useEffect,useRef,useState} from "react";
import {browserVoiceDependencies,REPLY_LIMIT,VoiceReplySession,type VoicePhase} from "@/lib/voice-reply";

export function VoiceReply({value,onChange,onBusyChange}:{value:string;onChange:(text:string)=>void;onBusyChange:(busy:boolean)=>void}){
  const [supported,setSupported]=useState<boolean|null>(null),[phase,setPhase]=useState<VoicePhase>("idle");
  const [error,setError]=useState(""),[interim,setInterim]=useState(""),[audio,setAudio]=useState("");
  const [seconds,setSeconds]=useState(0),[language,setLanguage]=useState("en-US");
  const session=useRef<VoiceReplySession|null>(null),audioRef=useRef(""),started=useRef(0),busyLock=useRef(false);
  const changeRef=useRef(onChange),busyRef=useRef(onBusyChange);changeRef.current=onChange;busyRef.current=onBusyChange;
  const busy=phase!=="idle";
  useEffect(()=>{
    setSupported(Boolean(browserVoiceDependencies()));
    const locale=navigator.language;if(["en-US","en-GB","en-NG","es-ES","fr-FR","de-DE","pt-BR","hi-IN"].includes(locale))setLanguage(locale);
    return()=>{session.current?.dispose();if(audioRef.current)URL.revokeObjectURL(audioRef.current);busyRef.current(false);};
  },[]);
  useEffect(()=>{
    if(!busy)return;
    const leave=()=>session.current?.stop();
    const hidden=()=>{if(document.hidden)leave();};
    const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    document.addEventListener("visibilitychange",hidden);window.addEventListener("pagehide",leave);window.addEventListener("beforeunload",unload);
    const timer=setInterval(()=>setSeconds(Math.floor((Date.now()-started.current)/1000)),1000);
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",hidden);window.removeEventListener("pagehide",leave);window.removeEventListener("beforeunload",unload);};
  },[busy]);
  const clearAudio=()=>{if(audioRef.current)URL.revokeObjectURL(audioRef.current);audioRef.current="";setAudio("");};
  const start=()=>{
    if(busyLock.current)return;
    const deps=browserVoiceDependencies();if(!deps){setSupported(false);return;}
    busyLock.current=true;session.current?.dispose();clearAudio();setError("");setInterim("");setSeconds(0);started.current=Date.now();
    const next=new VoiceReplySession(deps,{
      phase:nextPhase=>{busyLock.current=nextPhase!=="idle";setPhase(nextPhase);busyRef.current(nextPhase!=="idle");},
      transcript:text=>changeRef.current(text),interim:setInterim,error:setError,
      audio:blob=>{clearAudio();audioRef.current=URL.createObjectURL(blob);setAudio(audioRef.current);},
    },value,language);
    session.current=next;void next.start();
  };
  return <section className="voice-reply" aria-label="Voice reply">
    <div className="voice-heading"><div><p className="eyebrow">SPEAK YOUR MIND</p><h2>Say it in your own words.</h2></div><span className="voice-badge">VOICE REPLY</span></div>
    <p className="voice-description">Record a reply, then review and edit the transcript below. The same grading applies to spoken and typed answers.</p>
    {supported===false?<p className="voice-note" role="status">Voice transcription isn’t available in this browser. Use a browser with speech recognition, your keyboard’s dictation, or type below.</p>:<>
      <div className="voice-controls"><button type="button" className={busy?"voice-stop":"voice-record"} disabled={supported===null||phase==="finishing"||(!busy&&value.length>=REPLY_LIMIT)} onClick={()=>busy?session.current?.stop():start()}><span aria-hidden="true">{busy?"■":"●"}</span> {phase==="requesting"?"Cancel microphone request":phase==="finishing"?"Finishing transcript…":phase==="recording"?"Stop recording":audio?"Record more":"Record reply"}</button>
      <label>Language<select aria-label="Recording language" disabled={busy} value={language} onChange={event=>setLanguage(event.target.value)}>{[["en-US","English (US)"],["en-GB","English (UK)"],["en-NG","English (Nigeria)"],["es-ES","Español"],["fr-FR","Français"],["de-DE","Deutsch"],["pt-BR","Português"],["hi-IN","हिन्दी"]].map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
      {busy&&<span className="voice-time" role="status">{phase==="recording"?"Recording":"Microphone"} · {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</span>}</div>
      <p className="voice-note">Your browser’s speech provider may process your voice. Zynth saves only the transcript; audio stays on this page and is cleared when you leave or change steps. Each take can last up to five minutes.</p>
    </>}
    {interim&&<p className="voice-interim" aria-label="Words being recognized">{interim}</p>}
    {audio&&<div className="voice-playback"><audio controls src={audio} aria-label="Listen to your latest recording"/><button type="button" disabled={busy} onClick={clearAudio}>Remove audio</button><span>Your transcript is kept.</span></div>}
    {error&&<p role="alert" className="voice-error">{error}</p>}
    {!busy&&audio&&<p role="status" className="voice-note">Review your transcript before continuing. Nothing is submitted automatically.</p>}
  </section>;
}
