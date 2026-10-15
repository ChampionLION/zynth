import Link from "next/link";
import {WorldMapArt} from "@/components/WorldMap";
import {WORLD_POINTS,type WorldMark} from "@/lib/engines/markmap";
import {SiteAccountLinks} from "@/components/SiteAccountLinks";
const previewMarks:WorldMark[]=WORLD_POINTS.map(([x,y],i)=>({number:i+1,x,y,state:i<4?"completed":i===4?"current":"future",isMission:(i+1)%7===0,entry:null,exp:0}));
export default function LandingPage(){
 return <div className="site-landing">
  <a href="#main" className="site-skip">Skip to content</a>
  <header className="site-header"><Link href="/" className="site-wordmark"><span className="site-symbol" aria-hidden="true">✳</span>ZYNTH</Link><nav aria-label="Landing page"><a className="site-section-link" href="#how-it-works">The approach</a><a className="site-section-link" href="#your-journey">Your journey</a><SiteAccountLinks/></nav></header>
  <main id="main">
   <section className="site-hero">
    <div className="site-hero-copy"><p className="site-eyebrow"><span/>BECOME, ONE DAY AT A TIME</p><h1>Small steps.<br/>A different <em>you.</em></h1><p className="site-hero-description">Choose who you want to become. Take on a meaningful quest. Watch your skills, confidence, and direction take shape.</p><div className="site-hero-actions"><Link href="/auth?mode=signup" className="site-button">Find your starting point <span>→</span></Link><Link href="/auth?mode=signin" className="site-text-link">I already have an account ↗</Link></div><p className="site-hero-note">Five questions to begin. A journey that grows with you.</p></div>
    <div className="site-demo" aria-label="Illustrative preview of a Zynth journey">
     <div className="site-demo-header"><span className="site-demo-brand">✳ YOUR NEXT CHAPTER</span><span className="site-demo-live">ILLUSTRATIVE PREVIEW</span></div>
     <div className="site-demo-direction"><div><span>YOUR DIRECTION</span><h2>UX Designer</h2></div><span className="site-demo-level">04<small>LEVEL</small></span></div>
     <div className="site-demo-map"><WorldMapArt marks={previewMarks} decorative/><div className="site-demo-map-caption"><span>THE FIRST CROSSING</span><span>Every mark matters.</span></div></div>
     <div className="site-demo-quest"><div><span className="site-demo-overline">A LITTLE FURTHER, TODAY</span><span className="site-demo-time">◷ 10 MIN</span></div><h3>Make the everyday feel simpler.</h3><p>Reimagine a small interaction. Explain what you would change, and why it matters.</p><div className="site-demo-skills"><span>Clear thinking</span><span>Design instinct</span></div><Link href="/auth?mode=signup">Start your own journey <span>↗</span></Link></div>
     <div className="site-demo-footer"><span>Focus. Follow through. Become.</span><span>↗</span></div>
    </div>
   </section>
   <div className="site-domain-strip"><span>THERE ISN’T ONE WAY TO BECOME MORE.</span><div><span>Technical</span><span>Creative</span><span>Analytical</span><span>Social</span><span>Strategic</span></div></div>
   <section id="how-it-works" className="site-approach"><div className="site-section-heading"><p className="site-eyebrow">THE APPROACH</p><h2>A direction.<br/>Then, a little momentum.</h2><p>You don’t need your whole future figured out.<br/>Just somewhere you’d like to start.</p></div><div className="site-steps"><article><span>01 / START WITH YOU</span><h3>Name your direction.</h3><p>A role, a craft, or a version of yourself you want to work toward. A few everyday choices help shape your starting point.</p></article><article><span>02 / MAKE YOUR MOVE</span><h3>Do something meaningful.</h3><p>Write, plan, explain, or design. Complete a focused quest right here, shaped around your direction and the way you work.</p></article><article><span>03 / SEE THE CHANGE</span><h3>Leave a mark.</h3><p>Get feedback. Develop your skills. Follow the checkpoints on your map as your effort becomes visible.</p></article></div></section>
   <section id="your-journey" className="site-return"><div><p className="site-eyebrow">YOUR JOURNEY, KEPT</p><h2>Life happens.<br/><em>Pick up where you left off.</em></h2><p>Your account keeps your profile, progress, and unfinished work together. Sign back in and take the next step from there.</p></div><div className="site-return-action"><span className="site-return-symbol" aria-hidden="true">◎</span><h3>Still becoming.</h3><p>A fresh start, or your next chapter.</p><Link className="site-button" href="/auth?mode=signup">Create your account <span>↗</span></Link><Link className="site-text-link" href="/auth?mode=signin">Welcome back. Sign in →</Link></div></section>
  </main>
  <footer className="site-footer"><Link href="/" className="site-wordmark"><span className="site-symbol" aria-hidden="true">✳</span>ZYNTH</Link><p>Synthesize yourself. Reach your zenith.</p><div><Link href="/auth?mode=signin">Sign in</Link><Link href="/auth?mode=signup">Get started ↗</Link><span>© 2026 Zynth</span></div></footer>
 </div>;
}
