import {Suspense} from "react";
import {ZynthMark} from "@/components/BrandLogo";
import {AuthForm} from "@/components/AuthForm";
export default function AuthPage(){return <Suspense fallback={<main className="account-state"><ZynthMark className="account-brand-mark"/><p>Opening account access…</p></main>}><AuthForm/></Suspense>;}
