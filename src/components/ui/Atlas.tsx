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
export function EmptyState({title,children,action}:{title:string;children:React.ReactNode;action:React.ReactNode}){return <div className="atlas-empty"><svg viewBox="0 0 120 88" aria-hidden="true"><path d="M12 65 35 20 62 32 85 12 108 58 82 76 57 62 32 80Z"/><path d="M35 20 32 80M62 32 57 62M85 12 82 76"/><circle cx="64" cy="47" r="8"/><path d="m64 35 4 12-4 12-4-12Z"/></svg><h2>{title}</h2><p>{children}</p>{action}</div>;}
export function Tabs({label,items,value,onChange,segmented=false}:{label:string;items:{id:string;label:string;disabledReason?:string}[];value:string;onChange:(value:string)=>void;segmented?:boolean}){
 return <div className={`atlas-tabs ${segmented?"atlas-segmented":""}`} role="group" aria-label={label}>{items.map(item=><Button key={item.id} variant="ghost" aria-pressed={value===item.id} disabled={!!item.disabledReason} disabledReason={item.disabledReason} onClick={()=>onChange(item.id)}>{item.label}</Button>)}</div>;
}
export function Toast({children,tone="status"}:{children:React.ReactNode;tone?:"status"|"error"}){return <div className={`atlas-toast atlas-toast-${tone}`} role={tone==="error"?"alert":"status"}>{children}</div>;}
