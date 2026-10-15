"use client";
import Link from "next/link";
import {BrandLogo,ZynthMark} from "@/components/BrandLogo";
import {useEffect,useRef,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {isSupabaseConfigured,signIn,signUp,sendPasswordReset,friendlyAuthError} from "@/lib/auth";
import {useZynth} from "@/lib/store";
import {resumePath} from "@/lib/account-flow";
export function AuthForm(){
 const router=useRouter(),params=useSearchParams();
 const mode=params.get("mode")==="signup"?"signup":"signin";
 const {user,profile,activeQuest,hydrated,hydrationError}=useZynth();
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null);
 const [resetting,setResetting]=useState(false);
 const lock=useRef(false);
 const configured=isSupabaseConfigured();
 useEffect(()=>{setError(null);setNotice(null);setPassword("");setResetting(false);},[mode]);
 useEffect(()=>{if(hydrated&&user&&!hydrationError)router.replace(resumePath(profile,activeQuest));},[hydrated,user,profile,activeQuest,hydrationError,router]);
 const resume=async()=>{
   useZynth.getState().reset();
   await useZynth.getState().hydrate();
   const state=useZynth.getState();
   if(state.hydrationError)throw new Error(state.hydrationError);
   if(state.user)router.replace(resumePath(state.profile,state.activeQuest));
 };
 const submit=async(event:React.FormEvent)=>{
   event.preventDefault();if(lock.current||!configured)return;
   lock.current=true;setBusy(true);setError(null);setNotice(null);
   try{
     if(resetting){await sendPasswordReset(email);setNotice("If an account uses that email, a reset link is on its way. Check your inbox.");}
     else if(mode==="signup"){
       const result=await signUp(email,password,name);
       if(result.needsConfirmation)setNotice("Check your inbox to confirm your email. Then sign in to begin your journey.");
       else await resume();
     }else{await signIn(email,password);await resume();}
   }catch(e){setError(friendlyAuthError(e));}finally{lock.current=false;setBusy(false);}
 };
 return <main className="account-page"><header className="site-header"><Link href="/" className="site-wordmark"><BrandLogo priority/></Link><Link href="/" className="site-text-link">← Back to Zynth</Link></header>
  <div className="account-layout"><section className="account-intro"><p className="site-eyebrow">{mode==="signup"?"A DIRECTION WORTH FOLLOWING":"YOUR NEXT CHAPTER IS WAITING"}</p><h1>{mode==="signup"?<>A little closer<br/>to who you<br/><em>want to be.</em></>:<>Welcome back.<br/><em>Keep becoming.</em></>}</h1><p>{mode==="signup"?"Create your account. Find your starting point. Build a journey that feels like yours.":"Your profile, your marks, your momentum. Everything is right where you left it."}</p><div className="account-path" aria-hidden="true"><ZynthMark/><i/><span>◎</span><i/><span>↗</span></div><small>One meaningful step at a time.</small></section>
  <section className="account-card"><div className="account-tabs" aria-label="Account access"><Link href="/auth?mode=signup" aria-current={mode==="signup"?"page":undefined}>Sign up</Link><Link href="/auth?mode=signin" aria-current={mode==="signin"?"page":undefined}>Sign in</Link></div><p className="site-eyebrow">{resetting?"LET’S GET YOU BACK IN":mode==="signup"?"YOUR STARTING POINT":"PICK UP WHERE YOU LEFT OFF"}</p><h2>{resetting?"Forgot your password?":mode==="signup"?"Create your account.":"Good to see you again."}</h2><p className="account-card-description">{resetting?"We’ll send a link to set a new one.":mode==="signup"?"A small step today. A different you tomorrow.":"Sign in to continue your journey."}</p>
  {!configured&&<p className="account-notice" role="status">Account access is being connected. Please try again shortly.</p>}
  <form onSubmit={submit}>
   {mode==="signup"&&!resetting&&<div className="account-field"><label htmlFor="account-name">Your name</label><input id="account-name" name="name" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="What should we call you?"/></div>}
   <div className="account-field"><label htmlFor="account-email">Email address</label><input id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
   {!resetting&&<div className="account-field"><div className="account-label-row"><label htmlFor="account-password">Password</label>{mode==="signin"&&<button type="button" onClick={()=>{setResetting(true);setError(null);setNotice(null);}}>Forgot password?</button>}</div><div className="account-password"><input id="account-password" name="password" type={showPassword?"text":"password"} autoComplete={mode==="signup"?"new-password":"current-password"} required minLength={mode==="signup"?8:1} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup"?"At least 8 characters":"Your password"}/><button type="button" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Hide":"Show"}</button></div></div>}
   {error&&<p className="account-error" role="alert">{error}</p>}{notice&&<p className="account-notice" role="status">{notice}</p>}
   <button className="site-button account-submit" type="submit" disabled={busy||!configured}>{busy?"Just a moment…":resetting?"Send reset link":mode==="signup"?"Create account":"Sign in"}<span>→</span></button>
   {resetting&&<button type="button" className="account-back-link" onClick={()=>{setResetting(false);setNotice(null);setError(null);}}>← Back to sign in</button>}
  </form>
  <p className="account-footnote">{mode==="signup"?"Already started on this browser? Create an account with the same email to keep your saved local journey.":"Your progress stays with your account when you sign out."}</p>
  </section></div><footer className="account-footer">SYNTHESIZE YOUR ZENITH.</footer>
 </main>;
}
