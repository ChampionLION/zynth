import {authoredLearningQuest,authoredMission} from "../learning-content";
import {gradeLearningCheck} from "../learning";
// ─── Mock LLM ─────────────────────────────────────────────────────
// Deterministic, offline implementation of every LLM task.
// Lets the entire app run with zero API keys. Swapped out for the
// real Gemini→Groq chain when NEXT_PUBLIC_ZYNTH_MODE === "live".

import type {
  Domain,
  GradeResult,
  LLMProfileResult,
  LearningStyle,
  OnboardingAnswers,
  DailyQuestion,
  Quest,
  Profile,
  WeaknessSignal,
  Grade,
} from "../types";

import { ONBOARDING_QUESTIONS, aspirationDomain, validateOnboardingAnswers } from "../engines/onboarding";

// ── Onboarding classification ────────────────────────────────────

const DOMAIN_STAT_POOLS: Record<Domain, string[]> = {
  ANALYTICAL: ["Logic", "Reasoning", "Analysis", "Precision", "Insight", "Pattern"],
  TECHNICAL: ["Coding", "Systems", "Debugging", "Architecture", "Automation", "Engineering"],
  CREATIVE: ["Creativity", "Imagination", "Expression", "Design", "Storytelling", "Originality"],
  SOCIAL: ["Communication", "Persuasion", "Leadership", "Empathy", "Teaching", "Influence"],
  STRATEGIC: ["Strategy", "Planning", "Vision", "Decision", "Prioritization", "Foresight"],
};

const PROFESSIONS: Record<Domain, string[]> = {
  ANALYTICAL: ["Data Analyst", "Research Analyst", "Systems Analyst"],
  TECHNICAL: ["Software Developer", "AI Systems Builder", "Solutions Engineer"],
  CREATIVE: ["Content Strategist", "UX Designer", "Creative Producer"],
  SOCIAL: ["Educator", "Community Strategist", "Communications Lead"],
  STRATEGIC: ["Product Manager", "Brand Strategist", "Operations Strategist"],
};

const STARTING_SKILLS: Record<Domain, string[]> = {
  ANALYTICAL: ["Critical Thinking", "Data Interpretation", "Pattern Analysis", "Structured Reasoning"],
  TECHNICAL: ["Problem Decomposition", "System Design", "Logical Construction", "Technical Writing"],
  CREATIVE: ["Idea Generation", "Visual Thinking", "Narrative Craft", "Concept Development"],
  SOCIAL: ["Clear Communication", "Active Listening", "Persuasive Framing", "Empathic Reading"],
  STRATEGIC: ["Strategic Framing", "Decision Mapping", "Priority Setting", "Scenario Planning"],
};

const SIGNATURES: Record<Domain, string[]> = {
  ANALYTICAL: ["deep_analyst", "pattern_hunter", "precision_thinker"],
  TECHNICAL: ["fast_builder", "quiet_executor", "system_architect"],
  CREATIVE: ["restless_creator", "vivid_imaginer", "expressive_maker"],
  SOCIAL: ["natural_connector", "warm_communicator", "people_reader"],
  STRATEGIC: ["calculated_mover", "long_game_player", "decisive_planner"],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function mockClassifyOnboarding(input: OnboardingAnswers): LLMProfileResult {
  const answers = validateOnboardingAnswers(input);
  const domainScores: Record<Domain, number> = {
    ANALYTICAL: 0, TECHNICAL: 0, CREATIVE: 0, SOCIAL: 0, STRATEGIC: 0,
  };
  const styleScores: Record<LearningStyle, number> = {
    "Guided Learner": 0, "Practical Learner": 0,
    "Analytical Learner": 0, "Exploratory Learner": 0,
  };
  const weaknessScores: Partial<Record<WeaknessSignal, number>> = {};
  const core = { focus: 6, consistency: 6, adaptability: 6, execution: 6 };

  ONBOARDING_QUESTIONS.slice(1).forEach((question) => {
    const q = question.id;
    answers[q].forEach((opt, idx) => {
      const w = question.options.find(o => o.key === opt)?.signals;
      if (!w) return;
      const mult = idx === 0 ? 1 : 0.5;
      Object.entries(w.domains ?? {}).forEach(([d, v]) => {
        domainScores[d as Domain] += (v ?? 0) * mult;
      });
      Object.entries(w.styles ?? {}).forEach(([s, v]) => {
        styleScores[s as LearningStyle] += (v ?? 0) * mult;
      });
      Object.entries(w.weaknesses ?? {}).forEach(([wk, v]) => {
        weaknessScores[wk as WeaknessSignal] =
          (weaknessScores[wk as WeaknessSignal] ?? 0) + (v ?? 0) * mult;
      });
      core.focus += (w.focus ?? 0) * mult;
      core.consistency += (w.consistency ?? 0) * mult;
      core.adaptability += (w.adaptability ?? 0) * mult;
      core.execution += (w.execution ?? 0) * mult;
    });
  });

  const sortedDomains = (Object.entries(domainScores) as [Domain, number][])
    .sort(([, a], [, b]) => b - a);
  const goalDomain = aspirationDomain(answers.Q1[0]);
  const domain = goalDomain ?? (sortedDomains[0][1] > 0 ? sortedDomains[0][0] : "STRATEGIC");
  const totalDomainScore = sortedDomains.reduce((s, [, v]) => s + v, 0) || 1;
  const confidence = goalDomain ? 0.75 : Math.min(1, Math.max(0.3,
    sortedDomains[0][1] / totalDomainScore + 0.25));

  const style = (Object.entries(styleScores) as [LearningStyle, number][])
    .sort(([, a], [, b]) => b - a)[0];
  const learning_style: LearningStyle = style[1] > 0 ? style[0] : "Practical Learner";

  const weakness = (Object.entries(weaknessScores) as [WeaknessSignal, number][])
    .sort(([, a], [, b]) => b - a)[0];
  const weakness_signal: WeaknessSignal = weakness ? weakness[0] : "inconsistency";

  // Build 6 unique stat values in 4–10, total 42–52
  const seed = hashString(JSON.stringify({ Q2: answers.Q2, Q3: answers.Q3, Q4: answers.Q4, Q5: answers.Q5 }));
  const scores = [core.focus, core.consistency, core.adaptability, core.execution, 6 + seed % 4, 5 + ((seed >>> 3) % 4)];
  // Rank observations into six distinct foundation values; total is always 45.
  const ranked = scores.map((value,index)=>({value,index,tie:(seed >>> (index*3)) & 7})).sort((a,b)=>a.value-b.value || a.tie-b.tie || a.index-b.index);
  const values = new Array<number>(6);
  ranked.forEach((item,rank)=>{values[item.index]=5+rank;});

  const pool = DOMAIN_STAT_POOLS[domain];
  const stat5Name = pool[seed % pool.length];
  let stat6Name = pool[(seed >>> 4) % pool.length];
  if (stat6Name === stat5Name) stat6Name = pool[(1 + (seed >>> 4)) % pool.length];

  const profs = PROFESSIONS[domain];
  const skills = STARTING_SKILLS[domain]
    .slice(0, 3 + (seed % 2))
    .map((name) => ({ name, level: 1, exp: 0 }));
  const sigs = SIGNATURES[domain];

  return {
    profession: answers.Q1[0].toLowerCase() === "still exploring" ? profs[seed % profs.length] : answers.Q1[0],
    domain,
    domain_confidence: Number(confidence.toFixed(2)),
    learning_style,
    behavior_signature: sigs[(seed >>> 2) % sigs.length],
    weakness_signal,
    stats: {
      focus: values[0],
      consistency: values[1],
      adaptability: values[2],
      execution: values[3],
      stat_5: { name: stat5Name, value: values[4] },
      stat_6: { name: stat6Name, value: values[5] },
    },
    skills,
  };
}

// ── Quest generation ─────────────────────────────────────────────

export function mockGenerateQuest(profile: Profile, questType: Quest["type"], difficulty: number): Omit<Quest, "id" | "status" | "created_at" | "date"> {
  return questType === "mission" ? authoredMission(profile, difficulty) : authoredLearningQuest(profile, questType, difficulty);
}

// Grading

const MENTOR_LINES: Record<Grade, string[]> = {
  Excellent: [
    "That's the level. Remember what this felt like.",
    "You didn't just answer — you thought. It shows.",
    "This is what depth looks like. Keep this standard.",
  ],
  Good: [
    "Solid work. The next level is one layer deeper.",
    "You cleared it clean. Now push past clean.",
    "Good. Now imagine what thorough would look like.",
  ],
  Basic: [
    "Use the feedback to strengthen one part of your solution.",
    "Return to the given facts and work through the next step.",
    "A useful attempt can still be refined.",
  ],
  Bad: [
    "Start with one supplied fact and the rule that applies to it.",
    "A smaller, clearer step can make the solution easier to see.",
    "Review the case, then try a more specific approach.",
  ],
  Fail: [
    "You can return to the example and try again.",
    "Begin with the first part of the problem.",
    "There is room for another attempt.",
  ],
};

export function mockGradeResponse(args: {
  quest: Quest;
  response: string;
  profile: Profile;
  responseTimeSeconds: number;
  strict?: boolean;
}): GradeResult {
  const { quest, response, profile, responseTimeSeconds, strict } = args;
  const reinforcement=gradeLearningCheck(quest,response);
  if(reinforcement)return reinforcement;
  const text = response.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  const lexicalVariety = words.length ? uniqueWords / words.length : 0;
  const hasStructure = /\n/.test(text) || /\d[\.\)]/.test(text) || /[-•]/.test(text);
  const hasSpecifics = /\b(because|for example|specifically|when i|last|yesterday|today|my)\b/i.test(text);

  let score = 0;
  if (words.length >= 30) score += 1;
  if (words.length >= 80) score += 1;
  if (words.length >= 160) score += 1;
  if (sentences.length >= 3) score += 1;
  if (lexicalVariety > 0.55) score += 1;
  if (hasStructure) score += 1;
  if (hasSpecifics) score += 1;
  if (responseTimeSeconds > 120) score += 1;
  if (responseTimeSeconds < 25 && words.length < 40) score -= 2;
  if (strict) score -= 2;

  let grade: Grade;
  if (words.length < 5) grade = "Fail";
  else if (score <= 1) grade = "Bad";
  else if (score <= 3) grade = "Basic";
  else if (score <= 5) grade = "Good";
  else grade = "Excellent";

  // calibration is designed to succeed
  if (quest.type === "calibration" && grade !== "Fail" && words.length >= 15) {
    grade = score >= 4 ? "Excellent" : "Good";
  }

  const depth =
    grade === "Excellent" ? "thorough"
    : grade === "Good" ? "adequate"
    : responseTimeSeconds < 45 ? "rushed" : "shallow";

  const seed = hashString(text + profile.user_id);
  const mentorPool = MENTOR_LINES[grade];

  const strengths: string[] = [];
  if (hasSpecifics) strengths.push("Grounded in real, personal specifics");
  if (hasStructure) strengths.push("Clear structure that's easy to follow");
  if (words.length >= 120) strengths.push("Genuine depth of engagement");
  if (lexicalVariety > 0.6) strengths.push("Expressive, varied language");
  if (strengths.length === 0 && grade !== "Fail")
    strengths.push("You showed up and engaged");

  const improvements: string[] = [];
  if (!hasSpecifics) improvements.push("Anchor claims in concrete examples");
  if (words.length < 80) improvements.push("Go one layer deeper — expand your strongest point");
  if (!hasStructure && words.length > 60)
    improvements.push("Structure the response so each idea gets its own space");
  if (improvements.length === 0)
    improvements.push("Push into the uncomfortable edge of the question next time");

  const feedbackByGrade: Record<Grade, string> = {
    Excellent: `You engaged with "${quest.quest_title}" at real depth — the specifics and the reasoning both land. This is the kind of response the system was built to find.`,
    Good: `You met the criteria for "${quest.quest_title}" with solid, genuine work. A few threads were left unpulled — the depth is there, you just stopped one question early.`,
    Basic: `There's a real attempt here, but "${quest.quest_title}" asked for more than the surface. The core of your answer is a starting point, not a finish line.`,
    Bad: `The response to "${quest.quest_title}" needs a clearer connection to the supplied problem. Start by naming one given fact and explaining the rule you would use to address it.`,
    Fail: `There is not enough task-specific information here to assess a solution to "${quest.quest_title}". Revisit the problem and begin with its first step.`,
  };

  const engaged = quest.skills_targeted.slice(0, 2);
  const expSignal = grade === "Excellent" ? "high" : grade === "Good" ? "medium" : "low";

  return {
    grade,
    feedback: feedbackByGrade[grade],
    mentor_line: mentorPool[seed % mentorPool.length],
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
    behavioral_signals: {
      response_depth: depth,
      domain_relevance: grade === "Fail" ? "low" : grade === "Bad" ? "low" : hasSpecifics ? "high" : "medium",
      difficulty_handled:
        grade === "Excellent" ? "exceeded" : grade === "Good" || grade === "Basic" ? "met" : "struggled",
      completion_quality:
        grade === "Excellent" || grade === "Good" ? "strong" : grade === "Basic" ? "adequate" : "weak",
    },
    skill_progress:
      grade === "Fail" ? [] : engaged.map((name) => ({ name, exp_signal: expSignal as "high" | "medium" | "low" })),
    hidden_quest_triggered: grade === "Excellent" && seed % 100 < 15,
    skill_evolution_signal: null, // app-side counter handles this in mock mode
  };
}

// ── Daily profiling questions ────────────────────────────────────

const DAILY_QUESTION_BANK: DailyQuestion[] = [
  {
    question: "Pick the version of your day where you'd get the most done:",
    options: [
      { key: "A", label: "Starting at 5am before the world wakes up" },
      { key: "B", label: "Deep afternoon, after everything's been figured out" },
      { key: "C", label: "Late at night when no one can interrupt" },
      { key: "D", label: "Honestly? I'm equally useless at all of them" },
    ],
    category: "time_environment",
    signals_mined: "peak energy window",
  },
  {
    question: "You find an unmarked door in a building you know well. Do you open it?",
    options: [
      { key: "A", label: "Immediately. Obviously." },
      { key: "B", label: "Only if I can figure out what's behind it first" },
      { key: "C", label: "I note that it's there and move on" },
      { key: "D", label: "I'd mention it to someone else and let them decide" },
    ],
    category: "risk_tolerance",
    signals_mined: "risk and curiosity posture",
  },
  {
    question: "Someone cancels plans on you last minute. Your honest first reaction:",
    options: [
      { key: "A", label: "Relief, honestly" },
      { key: "B", label: "Annoyed — I had organized around this" },
      { key: "C", label: "I immediately start filling the time with something useful" },
      { key: "D", label: "I check in to make sure they're okay first" },
    ],
    category: "emotional_regulation",
    signals_mined: "response to disruption",
  },
  {
    question: "A stranger offers: take $5,000 now, or wait 2 years for $50,000. You:",
    options: [
      { key: "A", label: "Take the $5,000. The future is uncertain." },
      { key: "B", label: "Wait for the $50,000. The math is obvious." },
      { key: "C", label: "Ask a hundred questions before deciding anything" },
      { key: "D", label: "Depends entirely on what I need right now" },
    ],
    category: "ambition_signals",
    signals_mined: "time horizon preference",
  },
  {
    question: "Which version of 'successful' actually sounds appealing to you:",
    options: [
      { key: "A", label: "Known by a small group as genuinely exceptional" },
      { key: "B", label: "Widely recognized for something that matters" },
      { key: "C", label: "Financially free to do whatever I want" },
      { key: "D", label: "I just want to feel good about my days" },
    ],
    category: "identity_shifts",
    signals_mined: "success definition",
  },
  {
    question: "You're handed a group project with strangers. Your instinct:",
    options: [
      { key: "A", label: "Quietly take charge before anyone notices" },
      { key: "B", label: "Wait to see who's competent, then align with them" },
      { key: "C", label: "Claim the piece I can do alone and do it well" },
      { key: "D", label: "Focus on making the group actually get along" },
    ],
    category: "social_context",
    signals_mined: "group role preference",
  },
  {
    question: "It's raining hard and your plans are cancelled. The evening is yours. You:",
    options: [
      { key: "A", label: "Finally start that thing I keep postponing" },
      { key: "B", label: "Deep-dive whatever rabbit hole finds me first" },
      { key: "C", label: "Call or text someone I've been meaning to reach" },
      { key: "D", label: "Recharge. Blanket, screen, zero guilt." },
    ],
    category: "mood_energy",
    signals_mined: "unstructured time usage",
  },
  {
    question: "You get one honest sentence about yourself from everyone who knows you. You'd read:",
    options: [
      { key: "A", label: "All of them, immediately, twice" },
      { key: "B", label: "Only from the three people whose opinion I trust" },
      { key: "C", label: "None. I know who I am." },
      { key: "D", label: "I'd want to, but I'd be scared of what's there" },
    ],
    category: "emotional_regulation",
    signals_mined: "feedback appetite",
  },
  {
    question: "A skill fairy grants you mastery — but you must use it publicly every week. You pick:",
    options: [
      { key: "A", label: "Something spectacular people can watch" },
      { key: "B", label: "Something quietly useful nobody claps for" },
      { key: "C", label: "Something that makes me money, obviously" },
      { key: "D", label: "Something that helps people who need it" },
    ],
    category: "ambition_signals",
    signals_mined: "visibility vs utility preference",
  },
  {
    question: "Your ideal workspace, honestly:",
    options: [
      { key: "A", label: "Silent, clean, nothing out of place" },
      { key: "B", label: "Cozy chaos — my mess, my system" },
      { key: "C", label: "Somewhere public — café hum, library energy" },
      { key: "D", label: "It changes completely depending on the day" },
    ],
    category: "time_environment",
    signals_mined: "environment preference",
  },
  {
    question: "You've been given a mysterious box you can't open for one year. You:",
    options: [
      { key: "A", label: "Forget about it within a week" },
      { key: "B", label: "Think about it constantly. It would haunt me." },
      { key: "C", label: "Try to figure out what's inside from weight and sound" },
      { key: "D", label: "Honestly? I'd probably just open it." },
    ],
    category: "risk_tolerance",
    signals_mined: "impulse control and curiosity",
  },
  {
    question: "The version of you from 5 years ago meets you today. Their reaction:",
    options: [
      { key: "A", label: "Impressed — we came further than they hoped" },
      { key: "B", label: "Surprised — we're on a completely different path" },
      { key: "C", label: "Impatient — they'd expected more by now" },
      { key: "D", label: "Relieved — we're okay, and that's what they feared most" },
    ],
    category: "identity_shifts",
    signals_mined: "self-trajectory perception",
  },
];

export function mockDailyQuestion(profile: Profile): DailyQuestion {
  const asked = profile.continuous_profile_answers.map((a) => a.question);
  const fresh = DAILY_QUESTION_BANK.filter((q) => !asked.includes(q.question));
  const pool = fresh.length > 0 ? fresh : DAILY_QUESTION_BANK;
  const idx =
    (profile.continuous_profile_answers.length + hashString(profile.user_id)) %
    pool.length;
  return pool[idx];
}

// ── Small text generators ────────────────────────────────────────

export function mockEvolveSkillName(oldName: string, tier: number): string {
  const prefixes = ["Applied", "Advanced", "Strategic", "Masterful", "Signature"];
  const cleaned = oldName.replace(/^(Applied|Advanced|Strategic|Masterful|Signature)\s+/, "");
  const prefix = prefixes[Math.min(tier - 2, prefixes.length - 1)] ?? "Advanced";
  return `${prefix} ${cleaned}`;
}

export function mockDiscoveryMessage(skillName: string, profession: string): string {
  const templates = [
    `It was there in the way you kept circling back, long before you had a name for it. ${skillName} isn't something you learned this week — it's something you finally stopped hiding. The system has been watching it surface for days.`,
    `Every response left a trace, and the traces formed a shape: ${skillName}. Most people carry this without ever seeing it. You just did.`,
    `A ${profession} with ${skillName} is a different creature entirely. This was always in you. Now it has a name — and names can be trained.`,
  ];
  return templates[hashString(skillName + profession) % templates.length];
}

export function mockBehaviorSummary(profile: Profile): string {
  const recent = profile.behavior_log.slice(-10);
  const thorough = recent.filter((e) => e.response_depth === "thorough").length;
  const strong = recent.filter((e) => e.completion_quality === "strong").length;
  const depthNote =
    thorough >= 5 ? "consistently deep, thorough responses"
    : thorough >= 2 ? "flashes of real depth between adequate work"
    : "mostly surface-level engagement so far";
  const qualityNote =
    strong >= 5 ? "delivers strong completions when they engage"
    : "quality rises noticeably when the topic connects personally";
  return `This user shows ${depthNote}. They ${qualityNote}.`;
}
