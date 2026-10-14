// ─── Server-side LLM provider chain: Gemini Flash → Groq ─────────
// Used by /api/llm. Never imported client-side.

interface LLMCallOptions {
  maxTokens?: number;
  temperature?: number;
  expectJson?: boolean;
}

async function callGemini(prompt: string, opts: LLMCallOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.8,
          maxOutputTokens: opts.maxTokens ?? 1024,
          ...(opts.expectJson ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");
  return text;
}

async function callGroq(prompt: string, opts: LLMCallOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.expectJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq empty response");
  return text;
}

export function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/** Gemini Flash → Groq fallback chain. Throws if all providers fail. */
export async function llmChain(prompt: string, opts: LLMCallOptions = {}): Promise<string> {
  const errors: string[] = [];
  for (const provider of [callGemini, callGroq]) {
    try {
      return stripCodeFences(await provider(prompt, opts));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}
