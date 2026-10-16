export const VOICE_LIMIT_SECONDS = 300;
export const REPLY_LIMIT = 24000;

export interface SpeechResult {isFinal:boolean; readonly [index:number]:{transcript:string}}
export interface SpeechEvent {results:ArrayLike<SpeechResult>}
export interface Recognition {
  continuous:boolean; interimResults:boolean; lang:string;
  onresult:((event:SpeechEvent)=>void)|null;
  onerror:((event:{error:string})=>void)|null;
  onend:(()=>void)|null;
  start:()=>void; stop:()=>void; abort:()=>void;
}
export type RecognitionConstructor=new()=>Recognition;
export type VoicePhase="idle"|"requesting"|"recording"|"finishing";
export interface VoiceDependencies {
  getStream:()=>Promise<MediaStream>;
  makeRecorder:(stream:MediaStream)=>MediaRecorder;
  makeRecognition:()=>Recognition;
}
export interface VoiceCallbacks {
  phase:(value:VoicePhase)=>void;
  transcript:(value:string)=>void;
  interim:(value:string)=>void;
  audio:(value:Blob)=>void;
  error:(message:string)=>void;
}
export function appendTranscript(base:string,spoken:string):string {
  return [base.trimEnd(),spoken.trim()].filter(Boolean).join("\n\n").slice(0,REPLY_LIMIT);
}
export function voiceError(code:string):string {
  if(["not-allowed","service-not-allowed","NotAllowedError","SecurityError"].includes(code))return "Microphone or speech access was denied. Allow it in your browser settings, or type your reply.";
  if(["audio-capture","NotFoundError","NotReadableError"].includes(code))return "We couldn’t access your microphone. Check that it’s connected and available, then try again.";
  if(code==="network")return "Transcription lost its connection. Your captured words are kept. Reconnect and record more, or edit the reply.";
  if(code==="no-speech")return "No speech was detected. Try again closer to your microphone, or type your reply.";
  if(code==="language-not-supported")return "Speech recognition isn’t available in that language. Choose another language or type your reply.";
  return "Recording stopped unexpectedly. Your captured words are kept; you can edit them or try again.";
}

/** Browser media lifecycle, independent of React. No audio is uploaded by Zynth. */
export class VoiceReplySession {
  private stream:MediaStream|null=null;
  private recorder:MediaRecorder|null=null;
  private speech:Recognition|null=null;
  private disposed=false;
  private stopping=false;
  private chunks:Blob[]=[];
  private bytes=0;
  private timer:ReturnType<typeof setTimeout>|null=null;
  private finishTimer:ReturnType<typeof setTimeout>|null=null;
  private spoken="";
  private speechDone=true;
  private recorderDone=true;
  private finished=false;
  constructor(private deps:VoiceDependencies,private callbacks:VoiceCallbacks,private base:string,private language:string){}

  async start():Promise<void>{
    this.callbacks.phase("requesting");
    try {
      const stream=await this.deps.getStream();
      if(this.disposed||this.stopping){stream.getTracks().forEach(track=>track.stop());return;}
      this.stream=stream;
      const recorder=this.deps.makeRecorder(stream),speech=this.deps.makeRecognition();
      this.recorder=recorder;this.speech=speech;
      speech.lang=this.language;speech.continuous=true;speech.interimResults=true;
      speech.onresult=event=>{
        if(this.disposed||this.finished)return;
        const final:string[]=[],interim:string[]=[];
        for(let i=0;i<event.results.length;i++)(event.results[i].isFinal?final:interim).push(event.results[i][0].transcript);
        this.spoken=final.join(" ");
        this.callbacks.transcript(appendTranscript(this.base,this.spoken));
        this.callbacks.interim(interim.join(" "));
        if(appendTranscript(this.base,this.spoken).length>=REPLY_LIMIT){this.callbacks.error("Your reply reached the character limit. Review it before submitting.");this.stop();}
      };
      speech.onerror=event=>{if(this.disposed||this.finished)return;if(event.error!=="aborted")this.callbacks.error(voiceError(event.error));this.stop();};
      speech.onend=()=>{if(this.disposed||this.finished)return;this.speechDone=true;this.stop();this.finishIfReady();};
      recorder.ondataavailable=event=>{
        if(this.disposed||!event.data.size)return;
        this.bytes+=event.data.size;
        if(this.bytes>20*1024*1024){this.callbacks.error("Recording reached its size limit. Your transcript is kept.");this.stop();return;}
        this.chunks.push(event.data);
      };
      recorder.onerror=()=>{if(!this.disposed){this.callbacks.error(voiceError("recorder"));this.stop();}};
      recorder.onstop=()=>{
        this.releaseTracks();this.recorderDone=true;
        if(this.disposed)return;
        if(this.chunks.length)this.callbacks.audio(new Blob(this.chunks,{type:recorder.mimeType||this.chunks[0].type||"audio/webm"}));
        this.chunks=[];if(!this.stopping)this.stop();this.finishIfReady();
      };
      recorder.start(1000);this.recorderDone=false;
      this.speechDone=false;speech.start();
      if(this.stopping)return;
      this.callbacks.phase("recording");
      this.timer=setTimeout(()=>{this.callbacks.error("Five-minute limit reached. Review this take, then record more if needed.");this.stop();},VOICE_LIMIT_SECONDS*1000);
    } catch(error){
      if(this.disposed||this.finished)return;
      this.callbacks.error(voiceError(error instanceof Error?error.name:"unknown"));
      this.stop();
    }
  }
  stop():void{
    if(this.disposed||this.finished||this.stopping)return;
    this.stopping=true;if(this.timer)clearTimeout(this.timer);
    this.callbacks.phase("finishing");
    // A browser/provider may omit its final event. Never leave submission locked.
    this.finishTimer=setTimeout(()=>{try{this.speech?.abort();}catch{/* Recognition may already have ended. */}this.speechDone=true;this.recorderDone=true;this.releaseTracks();this.finishIfReady();},2500);
    try{this.speech?.stop();}catch{this.speechDone=true;}
    try{if(this.recorder&&this.recorder.state!=="inactive")this.recorder.stop();else this.recorderDone=true;}catch{this.recorderDone=true;}
    this.finishIfReady();
  }
  private finishIfReady():void{
    if(this.disposed||this.finished||!this.stopping||!this.speechDone||!this.recorderDone)return;
    this.finished=true;if(this.finishTimer)clearTimeout(this.finishTimer);
    this.releaseTracks();this.callbacks.interim("");this.callbacks.phase("idle");
  }
  private releaseTracks():void{this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;}
  dispose():void{
    this.disposed=true;if(this.timer)clearTimeout(this.timer);if(this.finishTimer)clearTimeout(this.finishTimer);
    if(this.speech){this.speech.onresult=null;this.speech.onend=null;this.speech.onerror=null;try{this.speech.abort();}catch{/* Already stopped. */}}
    if(this.recorder){this.recorder.onstop=null;this.recorder.ondataavailable=null;this.recorder.onerror=null;try{if(this.recorder.state!=="inactive")this.recorder.stop();}catch{/* Already stopped. */}}
    this.releaseTracks();this.chunks=[];
  }
}

export function browserVoiceDependencies():VoiceDependencies|null {
  if(typeof window==="undefined"||!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")return null;
  const scope=window as unknown as {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
  const Speech=scope.SpeechRecognition??scope.webkitSpeechRecognition;
  if(!Speech)return null;
  return {getStream:()=>navigator.mediaDevices.getUserMedia({audio:true}),makeRecorder:stream=>new MediaRecorder(stream),makeRecognition:()=>new Speech()};
}
