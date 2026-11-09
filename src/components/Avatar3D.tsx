"use client";
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {buildAvatarScene} from '@/lib/avatar-scene';
import type {Avatar} from '@/lib/avatar';
import type {Equipment} from '@/lib/inventory';
let snapshotRenderer:T.WebGLRenderer|undefined;
const snapshots=new Map<string,string>();
const lighting=new WeakMap<T.WebGLRenderer,T.WebGLRenderTarget>();
function illuminate(r:T.WebGLRenderer,scene:T.Scene){let target=lighting.get(r);if(!target){const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(r);target=pmrem.fromScene(environment,.05);lighting.set(r,target);environment.dispose();pmrem.dispose();}scene.environment=target.texture;scene.environmentIntensity=.45;}
function renderer(){const r=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;return r;}
export default function Avatar3D({value,equipment={},name,portrait=false,interactive=false}:{value:Avatar;equipment?:Equipment;name:string;portrait?:boolean;interactive?:boolean}){
 const host=useRef<HTMLDivElement>(null),controls=useRef<OrbitControls|null>(null),localRenderer=useRef<T.WebGLRenderer|null>(null),home=useRef<{position:T.Vector3;target:T.Vector3}|null>(null),[image,setImage]=useState(''),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const key=JSON.stringify([value,equipment,portrait]);
 useEffect(()=>()=>{const r=localRenderer.current;if(r){lighting.get(r)?.dispose();lighting.delete(r);r.dispose();r.forceContextLoss();r.domElement.remove();localRenderer.current=null;}},[]);
 useEffect(()=>{
  let disposed=false;setFailed(false);setImage('');
  const element=host.current;if(!element)return;
  let world:ReturnType<typeof buildAvatarScene>|undefined,r:T.WebGLRenderer|undefined,observer:ResizeObserver|undefined,frame=0;
  const timer=window.setTimeout(()=>{try{
   if(!interactive&&snapshots.has(key)){setImage(snapshots.get(key)!);return;}
   world=buildAvatarScene(value,equipment,portrait);
   if(!interactive){snapshotRenderer??=renderer();r=snapshotRenderer;illuminate(r,world.scene);r.setPixelRatio(1);r.setSize(portrait?192:600,portrait?192:600,false);r.render(world.scene,world.camera);const url=r.domElement.toDataURL('image/png');if(snapshots.size>=96)snapshots.delete(snapshots.keys().next().value!);snapshots.set(key,url);if(!disposed)setImage(url);world.dispose();world=undefined;return;}
   r=localRenderer.current??renderer();localRenderer.current=r;r.domElement.hidden=false;illuminate(r,world.scene);r.setPixelRatio(Math.min(window.devicePixelRatio,1.5));if(r.domElement.parentNode!==element)element.appendChild(r.domElement);
   home.current={position:world.camera.position.clone(),target:world.target.clone()};
   const orbit=new OrbitControls(world.camera,r.domElement);controls.current=orbit;orbit.target.copy(world.target);orbit.enablePan=false;orbit.minDistance=3;orbit.maxDistance=9;orbit.maxPolarAngle=Math.PI*.54;orbit.minPolarAngle=Math.PI*.2;orbit.update();
   const draw=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(world&&r)r.render(world.scene,world.camera);});};orbit.addEventListener('change',draw);
   const resize=()=>{if(!world||!r)return;const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;r.setSize(w,h,false);world.camera.aspect=w/h;world.camera.updateProjectionMatrix();draw();};observer=new ResizeObserver(resize);observer.observe(element);resize();
  }catch{if(localRenderer.current)localRenderer.current.domElement.hidden=true;if(!disposed)setFailed(true);}},0);
  return()=>{disposed=true;clearTimeout(timer);cancelAnimationFrame(frame);observer?.disconnect();controls.current?.dispose();controls.current=null;home.current=null;world?.dispose();};
 },[key,interactive,attempt]); // eslint-disable-line react-hooks/exhaustive-deps
 const retry=()=>{const r=localRenderer.current;if(r){lighting.get(r)?.dispose();lighting.delete(r);r.dispose();r.forceContextLoss();r.domElement.remove();localRenderer.current=null;}setAttempt(n=>n+1);};
 const zoom=(factor:number)=>{const orbit=controls.current;if(orbit){const offset=orbit.object.position.clone().sub(orbit.target).multiplyScalar(factor);offset.setLength(T.MathUtils.clamp(offset.length(),orbit.minDistance,orbit.maxDistance));orbit.object.position.copy(orbit.target).add(offset);orbit.update();}};
 return <div className={`avatar-3d ${interactive?'avatar-3d-interactive':''}`} aria-label={name} role={interactive?'group':'img'}>
  <div className="avatar-3d-canvas" ref={host}>{image&&<Image src={image} alt="" width={portrait?192:600} height={portrait?192:600} unoptimized/>}{failed&&<span className="avatar-3d-unavailable" role="status">Your Wayfarer couldn’t load.<button type="button" onClick={retry}>Try again</button></span>}{!image&&!interactive&&!failed&&<span className="avatar-3d-loading" aria-hidden="true">✦</span>}</div>
  {interactive&&!failed&&<div className="atelier-camera"><button type="button" aria-label="Rotate character left" onClick={()=>{if(controls.current){controls.current.object.position.applyAxisAngle(new T.Vector3(0,1,0),-.3);controls.current.update();}}}>↶</button><button type="button" aria-label="Rotate character right" onClick={()=>{if(controls.current){controls.current.object.position.applyAxisAngle(new T.Vector3(0,1,0),.3);controls.current.update();}}}>↷</button><button type="button" aria-label="Zoom in" onClick={()=>zoom(.85)}>+</button><button type="button" aria-label="Zoom out" onClick={()=>zoom(1.15)}>−</button><button type="button" aria-label="Reset camera" onClick={()=>{if(controls.current&&home.current){controls.current.object.position.copy(home.current.position);controls.current.target.copy(home.current.target);controls.current.update();}}}>Recenter</button></div>}
 </div>;
}
