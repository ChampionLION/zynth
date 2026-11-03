import {z} from "zod";
export const NativeFocusStateSchema=z.object({platform:z.literal("android"),enabled:z.boolean(),time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),reminderMinutes:z.union([z.literal(5),z.literal(10),z.literal(15)]),overlayAllowed:z.boolean(),exactAllowed:z.boolean(),notificationsAllowed:z.boolean(),overlay:z.boolean(),nextAt:z.string().nullable()});
export type NativeFocusState=z.infer<typeof NativeFocusStateSchema>;
type NativePort={postMessage:(message:string)=>void;onmessage:((event:{data:string})=>void)|null};
declare global{interface Window{ZynthNative?:NativePort}}
const pending=new Map<string,{resolve:(state:NativeFocusState)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let bound:NativePort|undefined;
export const hasNativeFocus=()=>typeof window!=="undefined"&&typeof window.ZynthNative?.postMessage==="function";
export function nativeFocusRequest(command:string,data:Record<string,unknown>={}):Promise<NativeFocusState>{
 if(!hasNativeFocus())return Promise.reject(new Error("Daily focus alarms are available in the Zynth Android app."));
 const port=window.ZynthNative!;
 if(bound!==port){
  bound=port;port.onmessage=event=>{
   try{
    const reply=JSON.parse(event.data) as {id:string;ok:boolean;state:unknown;error?:string};const request=pending.get(reply.id);if(!request)return;
    clearTimeout(request.timer);pending.delete(reply.id);
    const state=NativeFocusStateSchema.safeParse(reply.state);
    if(reply.ok&&state.success)request.resolve(state.data);else request.reject(new Error(reply.error??"Please reopen Zynth and try again."));
   }catch{/* Unknown native messages cannot resolve a request. */}
  };
 }
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(id);reject(new Error("The device did not respond. Please reopen Zynth and try again."));},6000);
  pending.set(id,{resolve,reject,timer});
  try{port.postMessage(JSON.stringify({id,command,data}));}catch{clearTimeout(timer);pending.delete(id);reject(new Error("The device setting could not be changed."));}
 });
}
export function notifyNativeQuestCompleted(owner:string,questId:string):void{
 if(hasNativeFocus())void nativeFocusRequest("questCompleted",{owner,questId}).catch(()=>{/* A committed result never fails because the native focus window closed. */});
}
