import { NextRequest, NextResponse } from "next/server";
import { llmChain } from "@/lib/llm/providers";
import {createClient} from "@supabase/supabase-js";
import {publicSupabaseConfig} from "@/lib/supabase";

// Token budgets per call type (Engine 8)
const MAX_TOKENS: Record<string, number> = {
  onboarding: 1024,
  quest_generation: 1024,
  grading: 800,
  hidden_skill_message: 200,
  skill_evolution_naming: 60,
  behavior_summary: 160,
  daily_profile_question: 300,
};

export async function POST(req: NextRequest) {
  try {
    const {url,key}=publicSupabaseConfig();
    if(!url||!key)return NextResponse.json({error:"Account access is not configured"},{status:503});
    const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if(!token)return NextResponse.json({error:"Sign in required"},{status:401});
    const {data,error}=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}).auth.getUser(token);
    if(error||!data.user)return NextResponse.json({error:"Sign in required"},{status:401});
    if(process.env.ZYNTH_TRUSTED_COMPLETION==="1")return NextResponse.json({error:"Use your journey actions for this request."},{status:403});
    const { prompt, purpose, expectJson } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length>48000 || !Object.hasOwn(MAX_TOKENS,purpose)) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const text = await llmChain(prompt, {
      maxTokens: MAX_TOKENS[purpose] ?? 800,
      expectJson: expectJson !== false,
    });
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LLM failure" },
      { status: 502 }
    );
  }
}
