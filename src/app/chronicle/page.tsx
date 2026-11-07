"use client";
import {useState} from "react";
import Link from "next/link";
import {useRequireProfile} from "@/components/useRequireProfile";
import {BottomNav} from "@/components/BottomNav";
import {Tabs,EmptyState,Chip,Button} from "@/components/ui/Atlas";
import {formatDate,display} from "@/lib/ui";
const COMMUNITY_SAMPLES = [
  {
    domain: "TECHNICAL",
    excerpt:
      "I'd rebuild the notification system as a pull model — the app asks 'what matters right now?' instead of everything shouting at once. Components: a priority queue, a quiet-hours gate, and a digest compiler...",
  },
  {
    domain: "CREATIVE",
    excerpt:
      "The café exists between two buildings that forgot about it. Rain sounds different here — softer, like it's apologizing. The menu is handwritten by whoever opened that morning...",
  },
  {
    domain: "ANALYTICAL",
    excerpt:
      "The obvious explanation is laziness. The hidden variable is decision cost: every option added to my morning increased the odds I'd do none of them. Test: remove all but one choice for a week...",
  },
  {
    domain: "SOCIAL",
    excerpt:
      "What he actually wants isn't credit — it's evidence that leaving his old job mattered. So the bridge sentence isn't about the project at all. It's: 'none of this existed before you came'...",
  },
  {
    domain: "STRATEGIC",
    excerpt:
      "Phase one is deliberately boring: thirty days of inventory before a single decision. Most campaigns die from moving before counting. The checkpoint is simple — can I predict next week's numbers?...",
  },
];

export default function ChroniclePage(){
 const {profile,hydrated}=useRequireProfile(),[tab,setTab]=useState('mine'),[query,setQuery]=useState(''),[skill,setSkill]=useState('all'),[category,setCategory]=useState('all');
 if(!hydrated||!profile)return null;
 const history=[...profile.quest_history].reverse(),skills=[...new Set(history.flatMap(q=>q.skills_targeted))];
 const filtered=history.filter(q=>(skill==='all'||q.skills_targeted.includes(skill))&&`${q.quest_title} ${q.feedback??''} ${q.response??''}`.toLowerCase().includes(query.toLowerCase()));
 const weeks=new Map<string,typeof filtered>();for(const q of filtered){const date=new Date(q.completed_at);date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));const key=date.toISOString().slice(0,10);weeks.set(key,[...(weeks.get(key)??[]),q]);}
 const samples=COMMUNITY_SAMPLES.filter(s=>category==='all'||s.domain===category),titles=['A quieter notification','A place between places','One less decision','A bridge worth building','Count before you move'];
 return <main className="app-page chronicle-v2"><header className="page-intro"><p className="eyebrow">YOUR EXPLORER’S JOURNAL</p><h1>Pages of <em>becoming.</em></h1></header><Tabs label="Chronicle" value={tab} onChange={setTab} items={[{id:'mine',label:'My Chronicle'},{id:'examples',label:'Examples'}]}/>
 {tab==='mine'?<>{history.length===0?<><EmptyState title="The first page is yours." action={<Link className="site-button" href="/dashboard">Start your first quest →</Link>}>Every quest you finish becomes a page here.</EmptyState><article className="journal-ghost" aria-label="Example chronicle entry"><span className="eyebrow">EXAMPLE</span><h2>A small idea, put into practice.</h2><div className="mission-skills"><Chip>Clear thinking</Chip><Chip>Creative practice</Chip></div><p>“I started with what I noticed, tried a different approach, and found a next step…”</p></article></>:<><div className="journal-filters"><label>Search your pages<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="A title, idea or reflection…"/></label><label>Skill<select value={skill} onChange={e=>setSkill(e.target.value)}><option value="all">All skills</option>{skills.map(s=><option key={s} value={s}>{s}</option>)}</select></label></div><div className="journal-timeline">{[...weeks].map(([week,entries])=><section key={week}><h2>Week of {formatDate(week)}</h2>{entries.map(q=><details className="journal-entry" key={q.quest_id+q.completed_at}><summary><span className="timeline-dot"/><span><small>{formatDate(q.completed_at)}</small><strong>{q.quest_title}</strong></span><Chip kind="progress">+{q.exp_earned} EXP</Chip></summary><div><div className="mission-skills">{q.skills_targeted.map(s=><Chip key={s}>{s}</Chip>)}</div>{q.feedback&&<p>{q.feedback}</p>}{q.response&&<blockquote>{q.response}</blockquote>}{q.mentor_line&&<p>{q.mentor_line}</p>}</div></details>)}</section>)}{!filtered.length&&<p>No pages match yet. Try another search or skill.</p>}</div></>}</>:null}
 {(tab==='examples'||!history.length)&&<section className="example-library"><header><div><p className="eyebrow">A LITTLE INSPIRATION</p><h2>Other ways to think.</h2></div><span>Examples · swipe to explore →</span></header><div className="category-chips" role="group" aria-label="Example categories">{['all','TECHNICAL','CREATIVE','ANALYTICAL','SOCIAL','STRATEGIC'].map(c=><Button key={c} variant="ghost" aria-pressed={category===c} onClick={()=>setCategory(c)}>{c==='all'?'All':display(c.toLowerCase())}</Button>)}</div><div className="example-carousel">{samples.map(sample=><article key={sample.domain}><Chip kind={sample.domain.toLowerCase() as 'technical'}>{sample.domain.toLowerCase()}</Chip><h3>{titles[COMMUNITY_SAMPLES.indexOf(sample)]}</h3><p>{sample.excerpt}</p><small>Example response</small></article>)}</div></section>}<BottomNav/></main>;
}
