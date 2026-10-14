import { NextRequest, NextResponse } from "next/server";
import { llmChain } from "@/lib/llm/providers";

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
    const { prompt, purpose, expectJson } = await req.json();
    if (!prompt || typeof prompt !== "string") {
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
