import {Suspense} from "react";
import {AuthForm} from "@/components/AuthForm";
export default function AuthPage(){return <Suspense fallback={<main className="account-state"><p>Opening account access…</p></main>}><AuthForm/></Suspense>;}
