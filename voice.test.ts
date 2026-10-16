import assert from "node:assert/strict";
import {appendTranscript,REPLY_LIMIT,VoiceReplySession,type Recognition,type SpeechEvent,type VoicePhase} from "./src/lib/voice-reply";

function fixture(){
  let stopped=0,aborted=0;const phases:VoicePhase[]=[],texts:string[]=[],interims:string[]=[],errors:string[]=[],clips:Blob[]=[];
  const stream={getTracks:()=>[{stop:()=>stopped++}]} as unknown as MediaStream;
  const speech:Recognition={continuous:false,interimResults:false,lang:"",onresult:null,onerror:null,onend:null,start(){},stop(){this.onend?.();},abort(){aborted++;}};
  const recorder={state:"inactive",mimeType:"audio/webm",ondataavailable:null as null|((e:{data:Blob})=>void),onstop:null as null|(()=>void),onerror:null,start(){this.state="recording";},stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["local sound"],{type:"audio/webm"})});this.onstop?.();}};
  const deps={getStream:async()=>stream,makeRecorder:()=>recorder as unknown as MediaRecorder,makeRecognition:()=>speech};
  const callbacks={phase:(p:VoicePhase)=>phases.push(p),transcript:(s:string)=>texts.push(s),interim:(s:string)=>interims.push(s),error:(s:string)=>errors.push(s),audio:(b:Blob)=>clips.push(b)};
  const emit=(words:[string,boolean][])=>speech.onresult?.({results:words.map(([transcript,isFinal])=>({0:{transcript},isFinal}))} as SpeechEvent);
  return {deps,callbacks,speech,recorder,phases,texts,interims,errors,clips,emit,stopped:()=>stopped,aborted:()=>aborted};
}
async function main(){
  assert.equal(appendTranscript("Typed beginning","Spoken answer"),"Typed beginning\n\nSpoken answer");
  assert.equal(appendTranscript("", "  Spoken answer  "),"Spoken answer");
  assert.equal(appendTranscript("x".repeat(REPLY_LIMIT-2),"more speech").length,REPLY_LIMIT);
  const f=fixture(),session=new VoiceReplySession(f.deps,f.callbacks,"Existing reply","en-NG");await session.start();
  assert.deepEqual(f.phases,["requesting","recording"]);assert.equal(f.speech.lang,"en-NG");
  f.emit([["I designed a first draft.",true],["Then I",false]]);
  assert.equal(f.texts.at(-1),"Existing reply\n\nI designed a first draft.");assert.equal(f.interims.at(-1),"Then I");
  f.emit([["I designed a first draft.",true],["Then I tested it.",true]]);
  f.emit([["I designed a first draft.",true],["Then I tested it.",true]]);
  assert.equal(f.texts.at(-1),"Existing reply\n\nI designed a first draft. Then I tested it.","Cumulative speech results cannot duplicate transcript");
  session.stop();assert.equal(f.phases.at(-1),"idle");assert.equal(f.stopped(),1);assert.equal(f.clips.length,1);assert.ok(f.clips[0].size>0);
  const count=f.texts.length;f.emit([["late result",true]]);assert.equal(f.texts.length,count);session.dispose();

  const pending=fixture();let grant!:(s:MediaStream)=>void;pending.deps.getStream=()=>new Promise(r=>{grant=r;});
  const canceled=new VoiceReplySession(pending.deps,pending.callbacks,"Kept reply","en-US");const starting=canceled.start();canceled.stop();
  grant({getTracks:()=>[{stop:()=>pending.recorder.stop()}]} as unknown as MediaStream);await starting;
  assert.equal(pending.phases.at(-1),"idle");assert.equal(pending.speech.onresult,null,"A canceled permission request must not start listening");canceled.dispose();

  const rejected=fixture();rejected.deps.getStream=async()=>{throw new DOMException("denied","NotAllowedError");};
  const denied=new VoiceReplySession(rejected.deps,rejected.callbacks,"Saved words","en-US");await denied.start();
  assert.match(rejected.errors[0],/denied/);assert.equal(rejected.phases.at(-1),"idle");assert.equal(rejected.clips.length,0);denied.dispose();

  const failed=fixture(),failure=new VoiceReplySession(failed.deps,failed.callbacks,"","en-US");await failure.start();failed.emit([["Words before a network failure",true]]);failed.speech.onerror?.({error:"network"});
  assert.match(failed.errors[0],/connection/);assert.equal(failed.texts.at(-1),"Words before a network failure");assert.equal(failed.stopped(),1);assert.equal(failed.phases.at(-1),"idle");failure.dispose();

  const unmount=fixture(),removed=new VoiceReplySession(unmount.deps,unmount.callbacks,"","en-US");await removed.start();removed.dispose();
  assert.equal(unmount.stopped(),1);assert.equal(unmount.speech.onresult,null);assert.ok(unmount.aborted()>0);assert.equal(unmount.clips.length,0,"Unmount cannot publish audio to another step/account");
  console.log("Voice lifecycle passed: transcript append/deduplication/limits, local audio, permission denial/cancellation, provider failure and microphone cleanup. Browser speech service accuracy is verified separately.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
