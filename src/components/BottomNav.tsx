"use client";
import Link from "next/link";
import {BrandLogo} from "@/components/BrandLogo";
import {useEffect,useState} from "react";
import {FlameIcon} from "./ui/Atlas";
import {todayStr} from "@/lib/engines/quest";
import { usePathname } from "next/navigation";
import {useZynth} from "@/lib/store";
import {ProfilePicture} from "./ProfilePicture";
const tabs = [{href:"/dashboard",label:"Overview",icon:"◈"},{href:"/markmap",label:"Map",icon:"⬡"},{href:"/chronicle",label:"Chronicle",icon:"▤"},{href:"/leaderboard",label:"Leaderboard",icon:"△"},{href:"/profile",label:"Me",icon:"◎"}];
export function BottomNav() {
 const pathname=usePathname();
 const profile=useZynth(state=>state.profile);
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>{try{setCollapsed(localStorage.getItem('zynth:nav-collapsed')==='yes');}catch{}},[]);
 useEffect(()=>{document.body.dataset.navCollapsed=String(collapsed);return()=>{delete document.body.dataset.navCollapsed;};},[collapsed]);
 const pending=profile?.last_quest_date!==todayStr();
 return <nav className={`workspace-nav ${collapsed?'nav-collapsed':''}`} aria-label="Main navigation"><Link href="/dashboard" className="brand" aria-label="Zynth Overview"><BrandLogo tone="light"/></Link><button className="nav-collapse" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>{try{localStorage.setItem('zynth:nav-collapsed',!v?'yes':'no');}catch{}return !v;})}>{collapsed?'→':'←'}</button><p className="nav-caption">YOUR JOURNEY</p><div className="nav-items">{tabs.map(t=><Link key={t.href} title={t.label} aria-label={t.label} href={t.href} aria-current={pathname.startsWith(t.href)?"page":undefined} className={pathname.startsWith(t.href)?"nav-item active":"nav-item"}><span aria-hidden="true">{t.href==="/profile"&&profile?<ProfilePicture owner={profile.user_id} name={profile.character_name||profile.display_name}/>:pathname.startsWith(t.href)?({"◈":"◆","⬡":"⬢","▤":"▣","△":"▲","◎":"●"}[t.icon]??t.icon):t.icon}</span><span className="nav-label">{t.label}</span>{t.href==='/dashboard'&&pending&&<i className="nav-pending" aria-label="Today's mission is waiting"/>}</Link>)}</div><div className="nav-footer"><div className="nav-note"><span><FlameIcon/></span><p>{profile?.streak?`${profile.streak}-day streak`:'Start your streak today'}<small>{pending?"Today's mission is waiting.":"Today's mark is made. Nicely done."}</small></p></div><Link href="/settings" title="Settings" aria-label="Settings" aria-current={pathname==="/settings"?"page":undefined} className={pathname==="/settings"?"nav-item active":"nav-item"}><span>⚙</span><span className="nav-label">Settings</span></Link></div></nav>;
}
