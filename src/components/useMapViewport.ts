"use client";
import {useEffect,useRef,useState} from "react";
import type {PointerEvent} from "react";
export function useMapViewport(){
 const [view,setView]=useState({x:0,y:0,scale:1}),points=useRef(new Map<number,{x:number;y:number}>()),moved=useRef(false),previous=useRef<{x:number;y:number;distance:number}|null>(null);
 const [element,ref]=useState<HTMLDivElement|null>(null),origin=useRef({x:0,y:0});
 useEffect(()=>{const node=element;if(!node)return;const wheel=(e:WheelEvent)=>{e.preventDefault();setView(v=>e.ctrlKey?{...v,scale:Math.max(.65,Math.min(3,v.scale*Math.exp(-e.deltaY*.005)))}:{...v,x:Math.max(-1200,Math.min(1200,v.x-e.deltaX)),y:Math.max(-700,Math.min(700,v.y-e.deltaY))});};node.addEventListener('wheel',wheel,{passive:false});return()=>node.removeEventListener('wheel',wheel);},[element]);
 const position=()=>{const p=[...points.current.values()];return {x:p.reduce((n,p)=>n+p.x,0)/p.length,y:p.reduce((n,p)=>n+p.y,0)/p.length,distance:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};};
 const zoom=(scale:number)=>setView(v=>({...v,scale:Math.max(.65,Math.min(3,scale))}));
 const start=(e:PointerEvent)=>{if(e.button!==0)return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});previous.current=position();origin.current={x:e.clientX,y:e.clientY};moved.current=false;};
 const move=(e:PointerEvent)=>{if(!points.current.has(e.pointerId))return;const old=previous.current;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=position();if(old){const dx=next.x-old.x,dy=next.y-old.y;if(Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>6||points.current.size>1){moved.current=true;e.currentTarget.setPointerCapture(e.pointerId);}if(moved.current)setView(v=>({x:Math.max(-1200,Math.min(1200,v.x+dx)),y:Math.max(-700,Math.min(700,v.y+dy)),scale:old.distance&&next.distance?Math.max(.65,Math.min(3,v.scale*next.distance/old.distance)):v.scale}));}previous.current=next;};
 const end=(e:PointerEvent)=>{points.current.delete(e.pointerId);previous.current=points.current.size?position():null;};
 return {ref,element,view,zoom,pan:(x:number,y:number)=>setView(v=>({...v,x,y})),recenter:(x=0,y=0)=>setView({x,y,scale:1}),handlers:{onPointerDown:start,onPointerMove:move,onPointerUp:end,onPointerCancel:end,onClickCapture:(e:React.MouseEvent)=>{if(moved.current){e.stopPropagation();e.preventDefault();moved.current=false;}}}};
}
