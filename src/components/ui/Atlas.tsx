"use client";
import React from "react";

type ButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"ghost";disabledReason?:string};
export function Button({variant="secondary",disabledReason,children,className="",...props}:ButtonProps){
 return <button {...props} className={`atlas-button atlas-button-${variant} ${className}`} data-disabled-reason={props.disabled?disabledReason??"Unavailable":undefined}>{children}</button>;
}
export function Card({variant="flat",className="",...props}:React.HTMLAttributes<HTMLElement>&{variant?:"flat"|"raised"|"highlighted"}){return <section {...props} className={`atlas-card atlas-card-${variant} ${className}`}/>;}
export function Chip({kind="neutral",children}: {kind?:"neutral"|"progress"|"technical"|"creative"|"analytical"|"social"|"strategic";children:React.ReactNode}){return <span className={`atlas-chip atlas-chip-${kind}`}>{children}</span>;}
export function ProgressBar({value,max=100,label}:{value:number;max?:number;label:string}){
 const percent=Math.max(0,Math.min(100,value/Math.max(1,max)*100));
 return <div className="atlas-progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{width:`${percent}%`}}/></div>;
}
export function EmptyState({title,children,action,illustration="map"}:{title:string;children:React.ReactNode;action:React.ReactNode;illustration?:"map"|"journal"|"podium"}){return <div className="atlas-empty"><svg viewBox="0 0 120 88" aria-hidden="true">{illustration==='podium'?<><path d="M12 76V49h30v27M42 76V29h34v47M76 76V59h30v17"/><path d="m59 7 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z"/></>:illustration==='journal'?<><path d="M21 13h70v64H21ZM29 13V7h70v63h-8M36 31h39M36 43h32M36 55h22"/><path d="m75 59 9-15 6 4-9 15-8 4Z"/></>:<><path d="M12 65 35 20 62 32 85 12 108 58 82 76 57 62 32 80Z"/><path d="M35 20 32 80M62 32 57 62M85 12 82 76"/><circle cx="64" cy="47" r="8"/><path d="m64 35 4 12-4 12-4-12Z"/></>}</svg><h2>{title}</h2><p>{children}</p>{action}</div>;}
export function Tabs({label,items,value,onChange,segmented=false}:{label:string;items:{id:string;label:string;disabledReason?:string}[];value:string;onChange:(value:string)=>void;segmented?:boolean}){
 return <div className={`atlas-tabs ${segmented?"atlas-segmented":""}`} role="group" aria-label={label}>{items.map(item=><Button key={item.id} variant="ghost" aria-pressed={value===item.id} disabled={!!item.disabledReason} disabledReason={item.disabledReason} onClick={()=>onChange(item.id)}>{item.label}</Button>)}</div>;
}
export function Toast({children,tone="status"}:{children:React.ReactNode;tone?:"status"|"error"}){return <div className={`atlas-toast atlas-toast-${tone}`} role={tone==="error"?"alert":"status"}>{children}</div>;}
export function LockIcon({size=16,unlocked=false}:{size?:number;unlocked?:boolean}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false"><path className="lock-shackle" d={unlocked?'M7 11V7a5 5 0 0 1 9-3':'M7 11V7a5 5 0 0 1 10 0v4'}/><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M12 14v3"/></svg>;}
export function FlameIcon({size=24}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false"><path d="M13 2c1 7-6 7-3 13 2-1 3-3 3-5 4 3 7 6 7 10a8 8 0 0 1-16 0c0-5 4-8 5-12 1 3 2 4 2 4 2-3 3-6 2-10Z"/><path d="M13 17c0 3-4 3-4 6a3 3 0 0 0 6 0c0-2-1-4-2-6Z"/></svg>;}
export function MicIcon(){return <svg width="22" height="24" viewBox="0 0 22 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="7" y="2" width="8" height="13" rx="4"/><path d="M4 10v2a7 7 0 0 0 14 0v-2M11 19v4M7 23h8"/></svg>;}
