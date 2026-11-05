"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {readOfflinePack,type StoredLesson} from "@/lib/offline-learning";
import type {Quest} from "@/lib/types";
export function OverviewLessons({owner,quest}:{owner:string;quest:Quest|null}){
 const [lessons,setLessons]=useState<StoredLesson[]>([]);
 useEffect(()=>{const update=()=>{const pack=readOfflinePack(owner);setLessons(pack?.lessons.filter(l=>l.sequence>=(pack.journal.cursors[l.domain]??0))??[]);};update();window.addEventListener("zynth-offline-updated",update);return()=>window.removeEventListener("zynth-offline-updated",update);},[owner]);
 const first=quest?.learning?.lessons[0]??lessons[0]?.learning.lessons[0];
 return <section className="quest-learning mb-8" aria-label="Your lessons"><div className="section-label"><h2>Your lessons</h2><span>LEARN BEFORE YOU ARE TESTED</span></div>{first&&<article className="quest-lesson"><p className="eyebrow">START HERE</p><h3>{first.title}</h3><p>{first.explanation}</p><div className="quest-worked-example"><span>WORKED EXAMPLE</span><p>{first.example}</p></div></article>}<Link href={quest?.learning?"/quest":"/offline?lesson=next"} className="site-button">{first?"Continue this lesson →":"Open your lessons →"}</Link><p className="text-xs text-muted">Short lessons and a small check. Missions bring the ideas together when you’re ready.</p></section>;
}
