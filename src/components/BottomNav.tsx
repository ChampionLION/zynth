"use client";
import Link from "next/link";
import {BrandLogo} from "@/components/BrandLogo";
import {BRAND_SLOGAN} from "@/lib/brand";
import { usePathname } from "next/navigation";
const tabs = [{href:"/dashboard",label:"Overview",icon:"◈"},{href:"/markmap",label:"Mark Map",icon:"⬡"},{href:"/chronicle",label:"Chronicle",icon:"≡"},{href:"/leaderboard",label:"Leaderboard",icon:"△"},{href:"/profile",label:"My identity",icon:"◎"}];
export function BottomNav() {
 const pathname=usePathname();
 return <nav className="workspace-nav" aria-label="Main navigation"><Link href="/dashboard" className="brand"><BrandLogo tone="light"/><small>{BRAND_SLOGAN}</small></Link><p className="nav-caption">YOUR WORKSPACE</p><div className="nav-items">{tabs.map(t=><Link key={t.href} href={t.href} aria-current={pathname.startsWith(t.href)?"page":undefined} className={pathname.startsWith(t.href)?"nav-item active":"nav-item"}><span aria-hidden="true">{t.icon}</span><span>{t.label}</span></Link>)}</div><div className="nav-footer"><div className="nav-note"><span>✧</span><p>One step closer.<small>Your next chapter starts today.</small></p></div><Link href="/settings" className="nav-item"><span>⚙</span> Settings</Link><p className="nav-version">ZYNTH / BECOME MORE</p></div></nav>;
}
