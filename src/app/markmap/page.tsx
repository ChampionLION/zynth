"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import { WorldMapArt } from "@/components/WorldMap";
import { activeWorldChapter, buildWorldMarks, completedMarks, MARKS_PER_CHAPTER } from "@/lib/engines/markmap";
import { GRADE_COLORS, formatDate } from "@/lib/ui";
import { useZynth } from "@/lib/store";
import { todayStr } from "@/lib/engines/quest";

export default function MarkMapPage() {
  const router = useRouter();
  const { profile, hydrated } = useRequireProfile();
  const activeQuest = useZynth(s=>s.activeQuest);
  const reducedMotion = useReducedMotion();
  const [chapter, setChapter] = useState<number | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const mapScroll = useRef<HTMLDivElement>(null);
  const currentChapter = profile ? activeWorldChapter(profile) : 0;
  const visibleChapter = chapter ?? currentChapter;
  const marks = useMemo(()=>profile ? buildWorldMarks(profile,visibleChapter) : [],[profile,visibleChapter]);
  const frontier = marks.find(m=>m.state==="current"||m.state==="tomorrow");
  const selected = marks.find(m=>m.number===selectedNumber) ?? frontier ?? marks[0];

  useEffect(()=>{
    const container=mapScroll.current;
    if (!container || !marks.length) return;
    const anchor=marks.find(m=>m.state==="current"||m.state==="tomorrow") ?? marks[0];
    container.scrollLeft = Math.max(0, anchor.x / 1200 * container.scrollWidth - container.clientWidth / 2);
  },[marks]);

  if (!hydrated || !profile) return null;
  const completed=completedMarks(profile).length;
  const readyQuest=activeQuest?.date===todayStr() && activeQuest.status==="active";
  const isSelectedActive=selected?.state==="current";
  const selectChapter=(next:number)=>{setChapter(next);setSelectedNumber(null);};

  return <motion.main className="app-page world-page" initial={reducedMotion?false:{opacity:0,x:35}} animate={{opacity:1,x:0}} transition={{duration:.35}}>
    <header className="workspace-header"><span>THE ZYNTH ATLAS</span><span>{completed} {completed===1?"MARK":"MARKS"} MADE</span></header>
    <div className="world-page-heading"><div><p className="eyebrow">A WORLD BUILT BY SHOWING UP</p><h1>Your Mark Map.</h1><p>Every completed day leaves a mark. Every seventh checkpoint is a mission landmark.</p></div><button className="quiet-link" onClick={()=>{setChapter(null);setSelectedNumber(null);}}>Return to my checkpoint ↗</button></div>
    <div className="world-toolbar"><div><p className="eyebrow">CHAPTER {String(visibleChapter+1).padStart(2,"0")}</p><h2>{visibleChapter===0?"The first crossing":`Beyond the crossing · ${visibleChapter+1}`}</h2><span>Marks {visibleChapter*MARKS_PER_CHAPTER+1}–{(visibleChapter+1)*MARKS_PER_CHAPTER}</span></div><div className="world-chapter-controls"><button aria-label="Previous chapter" disabled={visibleChapter===0} onClick={()=>selectChapter(visibleChapter-1)}>←</button><span>{visibleChapter+1} / {Math.max(3,currentChapter+2)}</span><button aria-label="Next chapter" disabled={visibleChapter>=Math.max(3,currentChapter+2)-1} onClick={()=>selectChapter(visibleChapter+1)}>→</button></div></div>
    <section className="world-map-frame" aria-label={`World map chapter ${visibleChapter+1}`}>
      <div className="world-map-scroll" ref={mapScroll} tabIndex={0} aria-label="Scrollable world map; use arrow keys to explore">
        <div className="world-map-stage">
          <WorldMapArt marks={marks} />
          {marks.map(mark=><button key={mark.number} className={`world-checkpoint checkpoint-${mark.state} ${mark.isMission?"checkpoint-mission":""} ${selected?.number===mark.number?"checkpoint-selected":""}`} style={{left:`${mark.x/12}%`,top:`${mark.y/6.8}%`}} aria-label={`${mark.isMission?"Mission":"Mark"} ${mark.number}, ${mark.state==="tomorrow"?"available tomorrow":mark.state==="future"?"locked":mark.state}${mark.entry?`, ${mark.entry.quest_title}, ${mark.entry.grade}`:""}`} aria-pressed={selected?.number===mark.number} onClick={()=>{ if(mark.state==="current") router.push(readyQuest?"/quest":"/dashboard"); else setSelectedNumber(mark.number); }}><span className="checkpoint-disc">{mark.state==="completed"?"✓":mark.isMission?"◇":mark.number}</span><span className="checkpoint-caption">{mark.state==="current"?"YOU ARE HERE":mark.isMission?`MISSION ${mark.number}`:`MARK ${mark.number}`}</span>{mark.state==="current"&&<span className="checkpoint-beacon"/>}</button>)}
        </div>
      </div>
      <footer className="world-map-legend"><div><span><i className="legend-completed"/>Completed</span><span><i className="legend-current"/>Current</span><span><i className="legend-future"/>Ahead</span><span><i className="legend-mission"/>Mission</span></div><p>Swipe or scroll sideways to explore</p></footer>
    </section>
    <section className="world-detail" aria-live="polite" aria-atomic="true">
      <div className="world-detail-symbol" aria-hidden="true">{selected?.state==="completed"?"✓":selected?.isMission?"◇":"◎"}</div>
      <div className="world-detail-copy"><p className="eyebrow">{selected?.isMission?"MISSION LANDMARK":"CHECKPOINT"} / MARK {selected?.number}</p><h2>{selected?.entry?.quest_title ?? (isSelectedActive ? readyQuest?activeQuest!.quest_title:"Your next mark starts here." : selected?.state==="tomorrow"?"Today's journey is complete.":"Uncharted territory.")}</h2>{selected?.entry ? <><p><span style={{color:GRADE_COLORS[selected.entry.grade].text}}>{selected.entry.grade}</span> · {formatDate(selected.entry.completed_at)} · +{selected.exp} EXP</p>{selected.entry.feedback&&<p className="world-detail-feedback">{selected.entry.feedback}</p>}</> : <p>{isSelectedActive?readyQuest?`${activeQuest!.estimated_time} · ${activeQuest!.type}${activeQuest!.steps.length?` · ${activeQuest!.steps.length} steps`:""}`:"Your daily check-in and quest are waiting in Overview.":selected?.state==="tomorrow"?"Your next checkpoint opens tomorrow. Your progress is saved.":selected?.isMission?"A mission landmark ahead. Keep making marks to reach it.":"This checkpoint opens as your journey advances."}</p>}</div>
      {isSelectedActive && <button className="world-detail-action" onClick={()=>router.push(readyQuest?"/quest":"/dashboard")}>{readyQuest?"Begin quest":"Prepare my quest"} →</button>}
    </section>
    <p className="world-map-note">The landscape is a view of your progress. Locked checkpoints are previews; weekly missions still follow your streak.</p>
    <BottomNav />
  </motion.main>;
}
