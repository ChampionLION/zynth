"use client";

// LEADERBOARD — scopes, categories, podium, list, sticky user row.
// Ranking reads never modify professions or rewards.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {Tabs,EmptyState} from "@/components/ui/Atlas";
import { useRequireProfile } from "@/components/useRequireProfile";
import { BottomNav } from "@/components/BottomNav";
import {LeaderboardJoin} from "@/components/LeaderboardJoin";
import {ProfilePicture} from "@/components/ProfilePicture";
import type {LeaderboardRegion} from "@/lib/engines/leaderboard";
import { DOMAIN_COLORS, domainColor } from "@/lib/ui";
import {
  getLeaderboard,
  type Scope,
  type Category,
} from "@/lib/engines/leaderboard";
import {isSupabaseConfigured} from "@/lib/supabase";
import type { LeaderboardRow } from "@/lib/types";

const SCOPES: { key: Scope; label: string }[] = [
  { key: "local", label: "Local" },
  { key: "state", label: "State" },
  { key: "national", label: "National" },
  { key: "global", label: "Global" },
];
const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All Skills" },
  { key: "TECHNICAL", label: "Technical" },
  { key: "CREATIVE", label: "Creative" },
  { key: "ANALYTICAL", label: "Analytical" },
  { key: "SOCIAL", label: "Social" },
  { key: "STRATEGIC", label: "Strategic" },
];

export default function LeaderboardPage() {
  const { profile, hydrated } = useRequireProfile();
  const [scope, setScope] = useState<Scope>("global");
  const [category, setCategory] = useState<Category>("all");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState("");
  const [ownScore,setOwnScore]=useState(0);
  const [participation,setParticipation]=useState("");
  const [offset,setOffset]=useState(0),[refresh,setRefresh]=useState(0);
  const [region,setRegion]=useState<LeaderboardRegion|undefined>(undefined);
  const [viewing,setViewing]=useState<LeaderboardRegion>({country:"",state:"",city:""});
  const [regions,setRegions]=useState<LeaderboardRegion[]>([]),[ownVisible,setOwnVisible]=useState(false),[rankChange,setRankChange]=useState(0);
  const rankBaseline=useRef(new Map<string,number>());
  useEffect(()=>{const node=document.querySelector('[data-own-row="true"]');if(!node){setOwnVisible(false);return;}const observer=new IntersectionObserver(entries=>setOwnVisible(entries[0].isIntersecting),{threshold:.2,rootMargin:'0px 0px -100px 0px'});observer.observe(node);return()=>observer.disconnect();},[rows,loading]);

  useEffect(() => {
    if (!profile) return;
    let current=true;const controller=new AbortController();setLoading(true);setError("");
    void getLeaderboard(profile, scope, category,offset,controller.signal,region).then((r) => {
      if(!current)return;
      if(offset>0&&offset>=r.total){setOffset(0);return;}
      setRows(r.rows);
      setUserRank(r.userRank);
      const rankKey=`zynth:observed-rank:${profile.user_id}:${scope}:${category}:${JSON.stringify(r.region)}`;
      try{if(!rankBaseline.current.has(rankKey))rankBaseline.current.set(rankKey,Number(localStorage.getItem(rankKey)??r.userRank));const before=rankBaseline.current.get(rankKey)??r.userRank;setRankChange(before>0&&r.userRank>0?before-r.userRank:0);if(r.userRank>0)localStorage.setItem(rankKey,String(r.userRank));}catch{setRankChange(0);}
      setTotal(r.total);
      setOwnScore(r.userRow?.score??0);setParticipation(r.participation);
      setViewing(r.region);setRegions(r.regions);
    }).catch(()=>{if(current)setError("We couldn’t load these rankings. Please try again.");}).finally(()=>{if(current)setLoading(false);});
    return()=>{current=false;controller.abort();};
  }, [profile?.user_id,profile?.cumulative_exp,profile?.leaderboard_opt_out, scope, category,offset,refresh,region]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const update=()=>{if(!document.hidden)setRefresh(value=>value+1);};
    const timer=setInterval(update,60000);window.addEventListener("focus",update);
    return()=>{clearInterval(timer);window.removeEventListener("focus",update);};
  },[]);

  if (!hydrated || !profile) return null;

  const top3 = offset===0?rows.slice(0, 3):[];
  const rest = offset===0?rows.slice(3):rows;
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <main className="app-page collection-page leaderboard-v2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leaderboard</h1>

      </div>

      {!isSupabaseConfigured() && <p className="mt-3 text-xs text-muted">Connect your account to load rankings.</p>}
      {isSupabaseConfigured()&&<LeaderboardJoin key={profile.user_id} owner={profile.user_id} onChange={value=>{if(value.choice==="regional")setRegion(value.location);setRefresh(count=>count+1);}}/>}
      <div className="leaderboard-control-row"><Tabs segmented label="Ranking scope" items={SCOPES.map(s=>({id:s.key,label:s.label}))} value={scope} onChange={value=>{setScope(value as Scope);setOffset(0);}}/>{scope!=='global'&&<label className="region-dropdown"><span className="sr-only">Browse a region</span><select aria-label="Browse a region" value={region?JSON.stringify(region):''} onChange={e=>{setRegion(e.target.value?JSON.parse(e.target.value):undefined);setOffset(0);}}><option value="">{[viewing.country,scope!=='national'?viewing.state:'',scope==='local'?viewing.city:''].filter(Boolean).join(' / ')||'Browse a region'}</option>{regions.map((r,i)=><option key={i} value={JSON.stringify(r)}>{[r.country,scope!=='national'?r.state:'',scope==='local'?r.city:''].filter(Boolean).join(' / ')}</option>)}</select></label>}</div>
      {/* CATEGORY PILLS */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {setCategory(c.key);setOffset(0);}}
            aria-pressed={category===c.key}
            className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
              category === c.key
                ? "bg-amber text-black"
                : "border border-edge text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (<p role="alert" className="mt-6 text-sm text-muted">{error} <button className="text-amber" onClick={()=>setRefresh(value=>value+1)}>Try again</button></p>) : loading ? (
        <div className="mt-8 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {rows.length===0&&<EmptyState illustration="podium" title={scope==="global"?"A place for your first mark.":"Be the first in your area."} action={<Link className="site-button" href="/dashboard">Complete a quest →</Link>}>Take one useful step and give your journey a place here.</EmptyState>}
          {/* PODIUM */}
          <div role="group" aria-label="Leading journeys" className="mt-6 flex items-end justify-center gap-3">
            {podiumOrder.map((r) => {
              const isFirst = r.rank === 1;
              return (
                <motion.div
                  key={r.rank}
                  data-own-row={r.is_user}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-24 flex-col items-center rounded-t-xl border border-edge bg-surface px-2 pt-3 ${
                    isFirst ? "pb-8" : "pb-4"
                  } ${r.is_user ? "border-amber" : ""}`}
                >
                  <ProfilePicture owner={r.is_user?profile.user_id:undefined} appearance={r.appearance} name={r.display_name}/>
                  <p className={`mt-1 text-lg font-black ${isFirst ? "text-gold" : "text-muted"}`}>
                    {r.rank}{r.is_user&&rankChange!==0&&<small title="Change since your last visit">{rankChange>0?' ↑':' ↓'}{Math.abs(rankChange)}</small>}
                  </p>
                  <p className="max-w-full truncate text-xs">{r.display_name}</p>
                  <p className="text-xs text-dim">Lv {r.level}</p>
                  <p className="text-xs font-semibold text-amber">
                    {r.score.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* LIST */}
          <div role="list" aria-label="Rankings" className="mt-4 space-y-1.5">
            {rest.map((r) => (
              <div
                key={r.rank}
                role="listitem"
                data-own-row={r.is_user}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  r.is_user
                    ? "border-amber bg-amber/10"
                    : "border-edge bg-surface"
                }`}
              >
                <span className="w-8 text-sm font-bold text-muted">{r.rank}{r.is_user&&rankChange!==0&&<small title="Change since your last visit">{rankChange>0?' ↑':' ↓'}{Math.abs(rankChange)}</small>}</span>
                <ProfilePicture owner={r.is_user?profile.user_id:undefined} appearance={r.appearance} name={r.display_name}/>
                <span className="flex-1 truncate text-sm">
                  {r.display_name}
                  {r.is_user && <span className="ml-1 text-xs text-amber">you</span>}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    background: domainColor(r.domain,.13),
                    color: DOMAIN_COLORS[r.domain],
                  }}
                >
                  {r.domain.slice(0, 4)}
                </span>
                <span className="w-10 text-right text-xs text-dim">Lv {r.level}</span>
                <span className="w-16 text-right text-xs font-semibold text-amber">
                  {r.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* STICKY USER ROW */}
          {userRank > 0 && !ownVisible && (
            <div role="region" aria-label="Your position" className="leaderboard-position fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-lg px-4">
              <div className="flex items-center gap-3 rounded-xl border border-amber bg-surface px-4 py-3 shadow-lg">
                <span className="w-10 text-sm font-bold text-amber">#{userRank}</span>
                <ProfilePicture owner={profile.user_id} name={profile.display_name}/>
                <span className="flex-1 text-sm">You{rankChange!==0&&<small title="Change since your last visit">{rankChange>0?' ↑':' ↓'}{Math.abs(rankChange)}</small>}</span>
                <span className="text-xs text-dim">of {total.toLocaleString()}</span>
                <span className="text-xs font-semibold text-amber">
                  {ownScore.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          {userRank===0&&participation==="not_verified"&&<p className="mt-6 text-center text-xs text-dim">Confirm your email to join the rankings.</p>}
        </>
      )}
      {!loading&&!error&&total>0&&<div role="navigation" aria-label="Leaderboard pages" className="mt-5 mb-4 flex items-center justify-between gap-3 text-xs text-muted"><span>{offset+1}–{offset+rows.length} of {total.toLocaleString()}</span><div className="flex gap-4"><button disabled={offset===0} onClick={()=>setOffset(value=>Math.max(0,value-25))} data-disabled-reason="No further page">← Previous</button><button disabled={offset+rows.length>=total} onClick={()=>setOffset(value=>value+25)} data-disabled-reason="No further page">Next →</button></div></div>}
      <BottomNav />
    </main>
  );
}
