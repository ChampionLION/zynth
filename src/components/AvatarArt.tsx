"use client";
import dynamic from 'next/dynamic';
import {parseAvatar,type Avatar} from '@/lib/avatar';
import type {Equipment} from '@/lib/inventory';
import '@/styles/atelier.css';
const Avatar3D=dynamic(()=>import('./Avatar3D'),{ssr:false,loading:()=> <div className="avatar-3d-loading" aria-label="Preparing your Wayfarer">✦</div>});
export function AvatarArt({value,equipment={},name='Your Wayfarer',portrait=false,interactive=false}:{value:Avatar;equipment?:Equipment;name?:string;portrait?:boolean;interactive?:boolean}){
 return <div className={`avatar-art scene-${value.background}`}><Avatar3D value={parseAvatar(value)} equipment={equipment} name={name} portrait={portrait} interactive={interactive}/></div>;
}
