"use client";
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {renderWayfarer} from '@/lib/avatar-image';
import type {Avatar} from '@/lib/avatar';
import type {Equipment} from '@/lib/inventory';
import '@/styles/avatar-image.css';

export default function AvatarImage({value,equipment={},name,portrait=false,interactive=false}:{value:Avatar;equipment?:Equipment;name:string;portrait?:boolean;interactive?:boolean}){
 const [art,setArt]=useState<Awaited<ReturnType<typeof renderWayfarer>>|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[closeup,setCloseup]=useState(false);
 const stage=useRef<HTMLDivElement>(null),key=JSON.stringify([value,equipment,portrait]);
 useEffect(()=>{let active=true;setFailed(false);setArt(null);void renderWayfarer(value,equipment,portrait).then(result=>{if(active)setArt(result);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[key,attempt]); // eslint-disable-line react-hooks/exhaustive-deps
 const reset=()=>{stage.current?.style.setProperty('--depth-x','0px');stage.current?.style.setProperty('--depth-y','0px');};
 return <div ref={stage} className={`avatar-image ${portrait?'avatar-image-portrait':''} ${interactive?'avatar-image-interactive':''} ${closeup?'avatar-image-closeup':''}`} role="group" aria-label={name} onPointerMove={event=>{if(!interactive||event.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const box=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty('--depth-x',`${((event.clientX-box.left)/box.width-.5)*12}px`);event.currentTarget.style.setProperty('--depth-y',`${((event.clientY-box.top)/box.height-.5)*8}px`);}} onPointerLeave={reset}>
  {art?interactive&&!portrait?<><div className="wayfarer-scenery" style={{backgroundImage:`url("${art.setting}")`}}/><div className="wayfarer-light"/><Image className="wayfarer-character" src={art.character} alt={name} width={800} height={1280} unoptimized/><div className="wayfarer-vignette"/></>:<Image className="wayfarer-picture" src={art.picture} data-portrait-src={art.portrait} alt={name} width={portrait?256:800} height={portrait?256:1280} unoptimized/>:<div className="wayfarer-loading" role="status">{failed?<><span>Your portrait couldn’t load.</span><button type="button" onClick={()=>setAttempt(n=>n+1)}>Try again</button></>:<span aria-label="Preparing your Wayfarer">✦</span>}</div>}
  {interactive&&art&&<div className="wayfarer-view-controls" aria-label="Portrait view"><button type="button" aria-pressed={!closeup} onClick={()=>{setCloseup(false);reset();}}>Full view</button><button type="button" aria-pressed={closeup} onClick={()=>{setCloseup(true);reset();}}>Close-up</button></div>}
 </div>;
}
