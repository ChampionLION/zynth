import assert from "node:assert/strict";
import {hasNativeFocus,nativeFocusRequest,notifyNativeQuestCompleted} from "./src/lib/native-focus";

async function run(){
 assert.equal(hasNativeFocus(),false);
 await assert.rejects(nativeFocusRequest("getState"),/Android app/);
 const state={platform:"android",enabled:false,time:"18:00",reminderMinutes:5,overlayAllowed:false,exactAllowed:false,notificationsAllowed:false,overlay:false,nextAt:null};
 const messages:{id:string;command:string;data:Record<string,unknown>}[]=[];
 const port={postMessage:(raw:string)=>{messages.push(JSON.parse(raw));},onmessage:null as ((event:{data:string})=>void)|null};
 Object.defineProperty(globalThis,"window",{value:{ZynthNative:port},configurable:true});
 assert.equal(hasNativeFocus(),true);
 const reply=(id:string,body:object)=>port.onmessage?.({data:JSON.stringify({id,...body})});
 const first=nativeFocusRequest("getState"),second=nativeFocusRequest("saveSchedule",{time:"09:15",enabled:true});
 assert.notEqual(messages[0].id,messages[1].id);
 reply("unrelated-id",{ok:true,state});
 port.onmessage?.({data:"malformed-json"});
 reply(messages[1].id,{ok:true,state:{...state,time:"09:15",enabled:true}});
 reply(messages[0].id,{ok:true,state});
 assert.equal((await second).time,"09:15");assert.equal((await first).enabled,false);
 const denied=nativeFocusRequest("saveSchedule");
 reply(messages.at(-1)!.id,{ok:false,error:"Allow display over other apps first."});
 await assert.rejects(denied,/Allow display/);
 const invalid=nativeFocusRequest("getState");
 reply(messages.at(-1)!.id,{ok:true,state:{...state,time:"99:99"}});
 await assert.rejects(invalid,/reopen Zynth/);
 port.postMessage=()=>{throw new Error("Port closed");};
 await assert.rejects(nativeFocusRequest("getState"),/could not be changed/);
 // Device failures cannot turn a committed quest result into a failed submission.
 notifyNativeQuestCompleted("owner","quest");
 await new Promise(resolve=>setTimeout(resolve,0));
 delete (globalThis as {window?:unknown}).window;
 console.log("Android bridge: unsupported browser, request isolation, malformed replies, permission errors and closed-port recovery passed.");
}
run().catch(error=>{console.error(error);process.exitCode=1;});
