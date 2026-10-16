"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {BrandLogo} from "@/components/BrandLogo";
import {useRequireProfile} from "@/components/useRequireProfile";
import {BottomNav} from "@/components/BottomNav";
import {domainColor,display} from "@/lib/ui";
import {getLeaderboard,LEADERBOARD_PAGE_SIZE,type Category} from "@/lib/engines/leaderboard";
import type {LeaderboardResult} from "@/lib/leaderboard-result";
import type {LeaderboardRow} from "@/lib/types";
const categories:Category[]=["all","TECHNICAL","CREATIVE","ANALYTICAL","SOCIAL","STRATEGIC"];
export default function LeaderboardPage(){
  const {profile,hydrated}=useRequireProfile();
  const [category,setCategory]=useState<Category>("all"),[offset,setOffset]=useState(0),[refresh,setRefresh]=useState(0);
  const [snapshot,setSnapshot]=useState<{key:string;data:LeaderboardResult}|null>(null),[error,setError]=useState("");
  const [pending,setPending]=useState(true);
  const key=`${profile?.user_id}:${category}:${offset}`;
  useEffect(()=>{
    if(!profile)return;
    let current=true;const controller=new AbortController();setPending(true);setError("");
    void getLeaderboard(profile,"global",category,offset,controller.signal).then(data=>{
      if(!current)return;
      if(offset>0&&offset>=data.total){setOffset(Math.max(0,Math.floor((data.total-1)/LEADERBOARD_PAGE_SIZE)*LEADERBOARD_PAGE_SIZE));return;}
      setSnapshot({key,data});
    }).catch(()=>{if(current)setError("We couldn’t load the rankings. Please try again.");}).finally(()=>{if(current)setPending(false);});
    return()=>{current=false;controller.abort();};
  // Only saved fields that can change this read need to refresh the board.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key,refresh,profile?.cumulative_exp,profile?.leaderboard_opt_out,profile?.display_name,profile?.domain]);
  useEffect(()=>{
    const update=()=>{if(!document.hidden)setRefresh(value=>value+1);};
    const interval=setInterval(update,60000);window.addEventListener("focus",update);
    return()=>{clearInterval(interval);window.removeEventListener("focus",update);};
  },[]);
  if(!hydrated||!profile)return null;
  const data=snapshot?.key===key?snapshot.data:null;
  const loading=pending||!data&&!error;
  const podium=data&&offset===0?data.rows.slice(0,3):[];
  const rows=data?(offset===0?data.rows.slice(3):data.rows):[];
  return <main className="app-page collection-page leaderboard-page">
    <header className="workspace-header"><span>GROW TOGETHER</span><span>GLOBAL RANKINGS</span></header>
    <div className="leaderboard-heading"><div><p className="eyebrow">EVERY STEP COUNTS</p><h1>Leaderboard</h1><p>Real journeys. Shared momentum. Ranked by saved lifetime EXP.</p></div><BrandLogo className="leaderboard-brand" tone="light"/></div>
    <div className="leaderboard-toolbar"><div><span className="leaderboard-global">◎ Global</span><span>{data?`${data.total.toLocaleString()} ${data.total===1?"participant":"participants"}`:"Finding your community…"}</span></div><button type="button" disabled={pending} onClick={()=>setRefresh(value=>value+1)}>{pending?"Refreshing…":"Refresh ↻"}</button></div>
    <div className="leaderboard-categories" role="group" aria-label="Ranking category">{categories.map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>{setCategory(value);setOffset(0);}}>{value==="all"?"All skills":display(value.toLowerCase())}</button>)}</div>
    <p className="leaderboard-note">First name and last initial only. You control visibility in <Link href="/settings">Settings</Link>. Regional boards will follow optional location preferences.</p>
    {error?<div className="leaderboard-empty" role="alert"><h2>Rankings couldn’t load.</h2><p>{error}</p><button onClick={()=>setRefresh(value=>value+1)}>Try again</button></div>:loading?<div className="mt-8 space-y-3" role="status" aria-label="Loading rankings">{Array.from({length:5},(_,i)=><div key={i} className="shimmer h-14 rounded-xl"/>)}</div>:data&&<>
      {data.participation==="opted_out"&&<p className="leaderboard-message">You’re browsing privately and aren’t included in these rankings. <Link href="/settings">Change visibility →</Link></p>}
      {data.participation==="no_progress"&&<p className="leaderboard-message">Complete a quest to earn EXP and join the rankings.</p>}
      {data.participation==="other_category"&&<p className="leaderboard-message">Your rank appears in All skills and {profile.domain.toLowerCase()}. You can explore every category.</p>}
      {data.total===0?<section className="leaderboard-empty"><span aria-hidden="true">✧</span><h2>A new board. A first step.</h2><p>No public journeys have earned EXP in this category yet.</p><Link href="/dashboard">Continue your journey →</Link></section>:<>
        {podium.length>0&&<section className="leaderboard-podium" aria-label="Leading journeys">{podium.map(row=><article key={row.rank} className={row.rank===1?"podium-first":""} aria-label={`Rank ${row.rank}: ${row.display_name}`}><span className="podium-rank">{row.rank===1?"✦":"#"}{row.rank}</span><div className="leaderboard-avatar" style={{background:domainColor(row.domain,.12),color:domainColor(row.domain)}}>{row.display_name[0]}</div><h2>{row.display_name}{row.is_user&&<small>you</small>}</h2><p>Level {row.level} · {row.domain.toLowerCase()}</p><strong>{row.score.toLocaleString()}<small>lifetime EXP</small></strong></article>)}</section>}
        {rows.length>0&&<section className="leaderboard-list" aria-label="Rankings"><div className="leaderboard-list-heading"><span>RANK / WAYFARER</span><span>LIFETIME EXP</span></div><ol start={offset===0?4:offset+1}>{rows.map(row=><RankingRow key={row.rank} row={row}/>)}</ol></section>}
        <div className="leaderboard-pagination"><span>{offset+1}–{Math.min(offset+data.rows.length,data.total)} of {data.total.toLocaleString()}</span><div><button disabled={offset===0||pending} onClick={()=>setOffset(value=>Math.max(0,value-LEADERBOARD_PAGE_SIZE))}>← Previous</button><button disabled={offset+data.rows.length>=data.total||pending} onClick={()=>setOffset(value=>value+LEADERBOARD_PAGE_SIZE)}>Next →</button></div></div>
      </>}
      {data.userRow&&<section className="leaderboard-own" aria-label="Your position"><div><span>YOUR POSITION</span><strong>#{data.userRank.toLocaleString()} <small>of {data.total.toLocaleString()}</small></strong></div><div><strong>{data.userRow.score.toLocaleString()}</strong><span>LIFETIME EXP</span></div></section>}
      <p className="leaderboard-note">Updated {new Date(data.updatedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}. Refreshes every minute while you’re here. Equal EXP is ordered by account creation.</p>
    </>}
    <BottomNav/>
  </main>;
}
function RankingRow({row}:{row:LeaderboardRow}){
  return <li className={row.is_user?"is-current-user":""}><span className="ranking-number">#{row.rank}</span><div className="ranking-person"><strong>{row.display_name}{row.is_user&&<small>you</small>}</strong><span>Level {row.level} · {row.domain.toLowerCase()}</span></div><strong>{row.score.toLocaleString()}</strong></li>;
}
