"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useZynth} from "@/lib/store";
import {RewardMoment} from "@/components/RewardMoment";
export default function EventsPage(){const router=useRouter(),{eventQueue,ackEvent}=useZynth(),current=eventQueue[0]??null;const[busy,setBusy]=useState(false),[error,setError]=useState('');useEffect(()=>{if(!current)router.replace('/dashboard');},[current,router]);if(!current)return null;return <RewardMoment key={JSON.stringify(current)} event={current} busy={busy} error={error} onContinue={()=>{if(busy)return;setBusy(true);setError('');void ackEvent().catch(()=>setError('Your progress is saved. Please try continuing again.')).finally(()=>setBusy(false));}}/>;}
