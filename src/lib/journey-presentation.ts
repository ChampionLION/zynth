import type {Profile,Quest} from "./types";
import {calculateFinalEXP} from "./engines/progression";
import {lessonRewards} from "./engines/lesson-rewards";
import {todayStr} from "./engines/quest";
export function attributes(p:Profile):[string,number][]{return [["Focus",p.stats.focus],["Consistency",p.stats.consistency],["Adaptability",p.stats.adaptability],["Execution",p.stats.execution],[p.stats.stat_5.name,p.stats.stat_5.value],[p.stats.stat_6.name,p.stats.stat_6.value]];}
export function rewardPreview(p:Profile,q:Quest){const extra=lessonRewards(p,q,"Good",todayStr()),streak=p.quest_history.some(h=>h.grade!=="Fail"&&h.completed_at.slice(0,10)===todayStr())?p.streak:p.streak+1;return `Up to +${calculateFinalEXP(q.learning?"Good":"Excellent",streak,p.prestige_exp_bonus,q.type)+extra.bonusExp} EXP${extra.skipTokens?' · +1 Skip Token':' · Skill practice'}`;}
export function caseBlocks(text:string){
 const [caseText,...reference]=text.split(/(?:Reference for this case|Reference material|Reference):?\s*/i);
 const lines=caseText.split(/\n+/).map(s=>s.trim()).filter(Boolean);
 const sentences=(lines.length>1?lines:caseText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map(s=>s.trim())??[caseText]).filter(s=>/[\p{L}\p{N}]/u.test(s));
 const first=sentences[0]??caseText,colon=first.indexOf(':');
 return colon>0&&colon<180?{problem:first.slice(0,colon)+':',evidence:[first.slice(colon+1).trim(),...sentences.slice(1)].filter(Boolean),reference:reference.join("\n")}:{problem:first,evidence:sentences.slice(1),reference:reference.join("\n")};
}
export function answerChecks(answer:string,scenario:string,criteria:string){
 const words=answer.trim().split(/\s+/).filter(Boolean).length;
 const dates=[...new Set(scenario.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+\d{1,2}\s+\w+)?\b|\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi)??[])].slice(0,3);
 return {words,checks:[{label:"Your answer has started",done:words>0},{label:"20-word reflection",done:words>=20},...dates.map(value=>({label:`References ${value}`,done:answer.toLowerCase().includes(value.toLowerCase())})),{label:criteria,done:false,manual:true}]};
}
/** Export a card using only the current user's visible facts. No account identifiers. */
export async function shareCard(title:string,lines:string[],avatar?:SVGSVGElement|HTMLImageElement|HTMLCanvasElement|null){
 const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=630;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image export is unavailable.");
 const css=getComputedStyle(document.documentElement),color=(key:string)=>css.getPropertyValue(key).trim();
 ctx.fillStyle=color("--atlas-deep");ctx.fillRect(0,0,1200,630);ctx.fillStyle=color("--glow");ctx.font="600 26px system-ui";ctx.fillText("ZYNTH / KEEP BECOMING",64,86);
 ctx.fillStyle=color("--atlas-paper");ctx.font="600 48px system-ui";
 const words=title.split(/\s+/);let line="",y=180;for(const word of words){if(ctx.measureText(line+word).width>760){ctx.fillText(line,64,y);y+=60;line="";}line+=word+" ";}ctx.fillText(line,64,y);
 ctx.font="26px system-ui";lines.slice(0,5).forEach((line,i)=>ctx.fillText(line.slice(0,64),64,y+72+i*42));
 if(avatar instanceof HTMLImageElement||avatar instanceof HTMLCanvasElement){try{ctx.drawImage(avatar,880,190,260,260);}catch{/* Sharing remains available while a portrait loads. */}}
 else if(avatar){try{const clone=avatar.cloneNode(true) as SVGSVGElement;const nodes=[avatar,...Array.from(avatar.querySelectorAll('*'))],copies=[clone,...Array.from(clone.querySelectorAll('*'))];nodes.forEach((node,i)=>{const c=getComputedStyle(node);for(const prop of ['fill','stroke','color'])copies[i].setAttribute(prop,c.getPropertyValue(prop));});const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=reject;img.src=url;});ctx.drawImage(img,880,190,260,260);}finally{URL.revokeObjectURL(url);}}catch{/* The fact card remains exportable without an illustration. */}}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Image export failed.")),"image/png"));
 const file=new File([blob],"zynth-journey.png",{type:"image/png"});
 if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title});return;}
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
