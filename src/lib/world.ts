import type {Profile} from "./types";
export const REGIONS=[
 {id:"foothills",version:1,name:"The Foothills",requires:0,connections:["glasswood"],landmark:"Wayfarer spring",summary:"Water returns to the Wayfarer spring.",x:210,y:400},
 {id:"glasswood",version:1,name:"Glasswood",requires:1,connections:["foothills","crossing"],landmark:"Lantern grove",summary:"Lanterns glow among the glasswood trees.",x:520,y:300},
 {id:"crossing",version:1,name:"The Crossing",requires:2,connections:["glasswood","zenith-ridge"],landmark:"Bridge of echoes",summary:"The bridge reconnects the quiet shores.",x:780,y:400},
 {id:"zenith-ridge",version:1,name:"Zenith Ridge",requires:3,connections:["crossing"],landmark:"Sky beacon",summary:"The ridge beacon shines across the atlas.",x:1000,y:220},
] as const;
export interface WorldState {version:1;selected:string;discovered:string[];restored:string[];sources:string[];missionCount?:number}
export const initialWorld=():WorldState=>({version:1,selected:"foothills",discovered:["foothills"],restored:[],sources:[]});
export function savedWorld(profile:Profile):WorldState {
 const mark=profile.memory.milestones.find(m=>m.type==="world_state");
 const state=mark?.state as WorldState|undefined;
 return state?.version===1&&Array.isArray(state.discovered)&&Array.isArray(state.restored)?state:initialWorld();
}
export function reconcileWorld(previous:WorldState,missions:string[],selected?:string,total=missions.length):WorldState {
 const sources=[...new Set([...previous.sources,...missions])].slice(-4);
 const discovered=[...new Set([...previous.discovered,...REGIONS.filter(r=>total>=r.requires).map(r=>r.id)])];
 const restored=[...new Set([...previous.restored,...(total>(previous.missionCount??0)?[previous.selected]:[])])];
 if(selected&&(!REGIONS.some(r=>r.id===selected)||!discovered.includes(selected)))throw new Error("This region is still beyond your path.");
 return {version:1,selected:selected??(REGIONS.some(r=>r.id===previous.selected)&&discovered.includes(previous.selected)?previous.selected:"foothills"),discovered,restored,sources,missionCount:Math.max(previous.missionCount??0,total)};
}
