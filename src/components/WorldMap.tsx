"use client";

import { useId } from "react";
import type { Profile } from "@/lib/types";
import { activeWorldChapter, buildWorldMarks, worldRouteSegment, type WorldMark } from "@/lib/engines/markmap";

const TREES = [[140,255],[170,240],[205,260],[245,225],[295,195],[350,180],[375,212],[450,465],[480,440],[510,465],[550,440],[610,470],[660,440],[700,465],[775,425]];
const MOUNTAINS = [[685,90],[720,75],[750,105],[925,520],[960,535],[990,510],[1030,540],[300,475],[330,460]];
const CONTOURS = [
  "M 65 390 C 40 280 145 135 285 120 S 470 210 455 340 S 270 500 165 540",
  "M 80 405 C 55 295 160 160 285 145 S 435 220 430 335 S 275 470 180 515",
  "M 335 350 C 345 190 450 110 595 150 S 715 290 640 400 S 425 510 360 450",
  "M 360 350 C 370 215 470 140 590 177 S 680 290 620 380 S 450 480 380 430",
  "M 695 295 C 700 135 855 95 980 125 S 1150 265 1120 390 S 990 590 825 570",
  "M 725 295 C 740 160 855 120 970 153 S 1115 270 1090 385 S 985 550 845 545",
];

/** Shared terrain and checkpoint geometry for the active map and Overview backdrop. */
export function WorldMapArt({ marks, decorative = false }: { marks: WorldMark[]; decorative?: boolean }) {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 1200 680" className="world-map-art" preserveAspectRatio={decorative ? "xMidYMid slice" : "xMidYMid meet"} aria-hidden="true" focusable="false">
    <defs><pattern id={`${id}-grid`} width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#253a3d" strokeWidth=".6"/></pattern><pattern id={`${id}-sea`} width="35" height="30" patternUnits="userSpaceOnUse"><path d="M6 18q6-4 12 0" fill="none" stroke="#395257" strokeWidth=".7"/></pattern></defs>
    <rect width="1200" height="680" fill="#101c20"/><rect width="1200" height="680" fill={`url(#${id}-grid)`} opacity=".4"/><rect width="1200" height="680" fill={`url(#${id}-sea)`} opacity=".16"/>
    <g className="map-land">
      <path d="M67 485L48 430 70 370 62 305 105 250 120 195 190 165 210 115 285 100 348 135 399 128 435 190 420 238 470 285 455 355 405 403 370 450 290 465 247 520 180 555 100 541Z"/>
      <path d="M380 396L375 340 415 299 447 229 462 168 525 124 595 143 640 120 701 166 707 219 660 260 690 302 655 363 620 410 595 467 512 497 450 470 403 451Z"/>
      <path d="M705 327L716 282 694 215 723 169 760 145 809 161 863 104 925 121 986 103 1027 158 1100 171 1134 239 1127 300 1150 348 1127 415 1090 440 1070 492 1020 530 968 570 898 579 851 553 788 575 735 534 765 465 717 421Z"/>
      <path d="M113 587l22-13 31 7 2 23-36 7zM542 555l31-15 34 9-6 23-46 8zM778 84l24-11 23 10-9 21-30 3z"/>
    </g>
    <g fill="none" stroke="#8b9c7e" strokeWidth="1" opacity=".15">{CONTOURS.map(d=><path key={d} d={d}/>)}</g>
    <path d="M280 119C235 230 380 250 329 377S245 460 210 523" fill="none" stroke="#3c6871" strokeWidth="4" opacity=".5"/>
    <path d="M925 127C915 227 854 293 869 365S947 395 940 462" fill="none" stroke="#3c6871" strokeWidth="4" opacity=".5"/>
    <g className="map-trees">{TREES.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0-14l-9 15h5l-8 10h24L4 1h5Z"/><path d="M0 11v6" fill="none"/></g>)}</g>
    <g className="map-mountains">{MOUNTAINS.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M-19 16L0-20 21 16Z"/><path d="M-7-7L0-20 9-5 3-9-2-6Z" className="snow"/></g>)}</g>
    <g className="map-region-labels"><text x="220" y="310" transform="rotate(-9 220 310)">THE FOOTHILLS</text><text x="515" y="385" transform="rotate(-8 515 385)">GLASSWOOD</text><text x="775" y="330" transform="rotate(-9 775 330)">THE CROSSING</text><text x="1010" y="440" transform="rotate(-8 1010 440)">ZENITH RIDGE</text></g>
    <g className="map-routes">{marks.slice(1).map((mark,i)=><path key={mark.number} d={worldRouteSegment(marks[i],mark)} className={marks[i].state==="completed" && mark.state==="completed"?"route-completed":"route-ahead"}/>)}</g>
    <g className="map-landmarks" fill="none" stroke="#a9aa88" strokeWidth="1.5" opacity=".6"><path d="M585 245v-27h20v27M590 218v-10h10v10M588 228h4m6 0h4M835 575v-25h-14v25m14-25h15v25m-21-34v-9m14 9v-9M809 575h52"/><path d="M690 315l22-16m-18 21 22-16m-22-6 5 21m6-29 5 22"/></g>
    <g transform="translate(1090 80)" className="map-compass"><circle r="31" fill="none"/><path d="M0-26l6 26-6 26-6-26zM-26 0l26-6 26 6-26 6z"/><text y="-41" textAnchor="middle">N</text></g>
    {decorative && <g>{marks.map(mark=><g key={mark.number} transform={`translate(${mark.x} ${mark.y})`} className={`art-mark art-mark-${mark.state}`}>{mark.isMission?<path d="M0 -21 L18 -11 L18 11 L0 21 L-18 11 L-18 -11 Z"/>:<circle r="16"/>}<text textAnchor="middle" y="5">{mark.state==="completed"?"✓":mark.number}</text></g>)}</g>}
    <text x="65" y="625" className="map-coordinate-label">ZYNTH ATLAS / AN UNFINISHED WORLD</text><text x="1135" y="625" textAnchor="end" className="map-coordinate-label">01° N · 14° E</text>
  </svg>;
}

export function OverviewMapBackground({ profile }: { profile: Profile }) {
  const chapter = activeWorldChapter(profile);
  return <div className="overview-world-background" aria-hidden="true"><WorldMapArt marks={buildWorldMarks(profile,chapter)} decorative /></div>;
}
