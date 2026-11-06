"use client";
import Link from "next/link";
import {useZynth} from "@/lib/store";
import {resumePath} from "@/lib/account-flow";
export function SiteAccountLinks(){
 const {user,profile,activeQuest,hydrated,hydrationError}=useZynth();
 if(hydrated&&user&&!hydrationError)return <Link className="site-button site-button-small" href={resumePath(profile,activeQuest)}>Continue your journey <span>↗</span></Link>;
 return <><Link className="site-signin" href="/auth?mode=signin">Sign in</Link><Link className="site-button site-button-small" href="/auth?mode=signup">Get started <span>↗</span></Link></>;
}
