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

interface QuestTemplate {
  quest_title: string;
  description: string;
  success_criteria: string;
  hint: string;
  flavor_text: string;
}

const CALIBRATION: Record<Domain, QuestTemplate> = {
  TECHNICAL: {
    quest_title: "The Blueprint in Your Head",
    description:
      "Think of something you've always wanted to build — an app, a tool, a system, anything. In a few sentences, describe what it is, who it's for, and the very first piece you'd build. No pressure, no wrong answers. This is just you thinking out loud.",
    success_criteria: "A genuine answer describing an idea and its first step.",
    hint: "Start with 'I've always wanted to build...' and let it flow.",
    flavor_text: "Every system begins as a sketch no one else can see.",
  },
  CREATIVE: {
    quest_title: "The Unmade Thing",
    description:
      "There's something you've imagined but never made. Describe it — what it looks like, what it feels like, why it keeps coming back to you. A few honest sentences is all this takes.",
    success_criteria: "A genuine description of an imagined creation.",
    hint: "Describe it like you're telling a friend at 2am.",
    flavor_text: "Some ideas wait years just to be spoken aloud.",
  },
  ANALYTICAL: {
    quest_title: "The Question That Follows You",
    description:
      "Everyone has one question they keep circling back to — something they genuinely want to understand. Write yours down, and explain in a few sentences why it hooks you.",
    success_criteria: "A genuine question and why it matters to the user.",
    hint: "It doesn't need to be profound. It needs to be yours.",
    flavor_text: "The sharpest minds are shaped by the questions they keep.",
  },
  SOCIAL: {
    quest_title: "The Conversation You Remember",
    description:
      "Think of one conversation that changed how you see something. Describe what was said, and what shifted in you afterward. A few honest sentences.",
    success_criteria: "A genuine reflection on a meaningful conversation.",
    hint: "It can be small. The shift is what matters.",
    flavor_text: "Every connection leaves a mark, if you look for it.",
  },
  STRATEGIC: {
    quest_title: "The Move You'd Make",
    description:
      "Imagine you're given full control of something you care about — a project, a team, a plan. Describe the first three moves you'd make and why, in order.",
    success_criteria: "Three genuine moves with reasoning.",
    hint: "Think sequence, not just ideas. What comes first matters.",
    flavor_text: "Strategy is just imagination with an order of operations.",
  },
};

const DAILY_ANGLES: Record<Domain, QuestTemplate[]> = {
  TECHNICAL: [
    {
      quest_title: "Deconstruct the Machine",
      description:
        "Pick any app or tool you used today. Break it down in writing: what are its core components, how does data likely flow through it, and what would you redesign about it?",
      success_criteria: "Clear component breakdown with at least one redesign idea.",
      hint: "Start from what you see on screen and work backwards.",
      flavor_text: "To the trained eye, every product is a glass box.",
    },
    {
      quest_title: "The Elegant Fix",
      description:
        "Describe a problem — technical or everyday — that annoys you regularly. Then design the simplest possible fix for it, in writing: what it does, how it works, why it's minimal.",
      success_criteria: "A real problem and a minimal, concrete solution design.",
      hint: "Elegance means removing, not adding.",
      flavor_text: "The best engineers are professionally lazy.",
    },
    {
      quest_title: "Explain It to the Past",
      description:
        "Choose one technical concept you understand well. Write an explanation your 12-year-old self would fully grasp — analogies allowed, jargon forbidden.",
      success_criteria: "Jargon-free explanation with a working analogy.",
      hint: "If a sentence needs a dictionary, rewrite it.",
      flavor_text: "Mastery is measured by how simply you can say it.",
    },
    {
      quest_title: "The Failure Autopsy",
      description:
        "Think of something you built or attempted that didn't work out. Write its autopsy: what you expected, what actually happened, and the one design decision you'd change.",
      success_criteria: "Honest analysis with a specific decision identified.",
      hint: "Blame the system, not yourself — then fix the system.",
      flavor_text: "Dead projects make the best teachers.",
    },
    {
      quest_title: "Design Under Constraint",
      description:
        "Design a tool that solves one real problem for someone you know — but it can only have ONE button. Describe the interface, what the button does, and what happens behind the scenes.",
      success_criteria: "Complete one-button design with behind-the-scenes logic.",
      hint: "Constraints aren't limits. They're focus.",
      flavor_text: "One button. Infinite discipline.",
    },
  ],
  CREATIVE: [
    {
      quest_title: "Steal Like a Synthesist",
      description:
        "Pick two completely unrelated things you love. In writing, combine them into one new concept — a product, a story, a design. Describe it vividly enough that someone could picture it.",
      success_criteria: "A genuine fusion of two unrelated things, vividly described.",
      hint: "The stranger the pairing, the better the offspring.",
      flavor_text: "Creation is theft with taste.",
    },
    {
      quest_title: "The Opening Line",
      description:
        "Write the opening paragraph of something — a story, an essay, a manifesto. It must make a stranger want the second paragraph. Then explain in two sentences why you made the choices you made.",
      success_criteria: "A hooking opening plus reasoning about craft choices.",
      hint: "Start in the middle of something already moving.",
      flavor_text: "First lines are doorways. Make them impossible to walk past.",
    },
    {
      quest_title: "Redesign the Ordinary",
      description:
        "Choose one boring everyday object. Redesign it in writing for maximum delight — appearance, feel, one surprising feature. Sell it to us.",
      success_criteria: "A vivid redesign with at least one surprising feature.",
      hint: "Ask: what would make someone smile using this?",
      flavor_text: "Nothing is ordinary to someone paying attention.",
    },
    {
      quest_title: "The Feeling, Translated",
      description:
        "Pick an emotion you felt this week. Express it in writing three different ways: as a color and texture, as a short scene, and as a single metaphor.",
      success_criteria: "Three distinct translations of one genuine emotion.",
      hint: "Don't name the emotion until the end — let the reader feel it first.",
      flavor_text: "Artists are translators for the wordless.",
    },
    {
      quest_title: "Worldbuild in Miniature",
      description:
        "Invent a place that doesn't exist — a café, a city block, a room. Describe it with enough sensory detail that a reader could close their eyes and stand in it.",
      success_criteria: "Sensory-rich description covering at least 3 senses.",
      hint: "What does it smell like? Sound like? Start there.",
      flavor_text: "Every world begins the size of a paragraph.",
    },
  ],
  ANALYTICAL: [
    {
      quest_title: "The Hidden Variable",
      description:
        "Pick a trend you've noticed — in your life, online, anywhere. Write your analysis: what's the obvious explanation, what's a hidden variable most people miss, and how would you test which is right?",
      success_criteria: "Obvious explanation + hidden variable + a testable check.",
      hint: "Ask: what would have to be true for the obvious answer to be wrong?",
      flavor_text: "The obvious answer is usually a decoy.",
    },
    {
      quest_title: "Steelman the Other Side",
      description:
        "Take an opinion you hold with confidence. Write the strongest possible argument AGAINST it — so strong the other side would applaud. Then note whether your confidence moved.",
      success_criteria: "A genuinely strong counter-argument, honestly engaged.",
      hint: "If your counter-argument feels comfortable, it isn't strong enough.",
      flavor_text: "Only the secure mind argues against itself.",
    },
    {
      quest_title: "Decompose the Decision",
      description:
        "Think of a decision you need to make (or made recently). Break it down in writing: the real options, the criteria that matter, the weights you'd assign, and the conclusion the analysis points to.",
      success_criteria: "Structured decision breakdown with criteria and weights.",
      hint: "Write the criteria before looking at the options.",
      flavor_text: "Clarity is a decision run through a sieve.",
    },
    {
      quest_title: "The Pattern Beneath",
      description:
        "List 5 things you did yesterday. Then find the non-obvious pattern connecting at least 3 of them — a motivation, a fear, a preference you didn't know was steering.",
      success_criteria: "A genuine non-obvious pattern across listed items.",
      hint: "Look at what you avoided as much as what you did.",
      flavor_text: "Your days are data. Read them.",
    },
    {
      quest_title: "Explain the Why",
      description:
        "Pick something that works and most people never question — traffic lights, prices ending in .99, anything. Explain in writing WHY it works the way it does, from first principles.",
      success_criteria: "First-principles explanation of a taken-for-granted system.",
      hint: "Keep asking 'but why?' until you hit bedrock.",
      flavor_text: "First principles are where certainty lives.",
    },
  ],
  SOCIAL: [
    {
      quest_title: "The Message That Lands",
      description:
        "Think of something you need to tell someone but haven't. Write the message word for word — exactly how you'd say it — crafted so they truly hear it. Then note the one choice you made to soften or sharpen it.",
      success_criteria: "A complete, considered message plus one craft note.",
      hint: "Lead with what you want them to feel, not what you want to say.",
      flavor_text: "The right words at the right time can move anything.",
    },
    {
      quest_title: "Teach One Thing",
      description:
        "Pick something you know that a friend doesn't. Write a mini-lesson teaching it — with one analogy, one example, and one question that checks they got it.",
      success_criteria: "Analogy + example + checking question, all present.",
      hint: "Teach the person, not the topic.",
      flavor_text: "To teach is to understand twice.",
    },
    {
      quest_title: "Read the Room, In Writing",
      description:
        "Describe a recent group situation — a chat, a meeting, a dinner. Analyze the dynamics in writing: who held influence, what went unsaid, and what one sentence from you could have shifted.",
      success_criteria: "Dynamics analysis with a specific intervention sentence.",
      hint: "Silence carries as much signal as speech.",
      flavor_text: "Every room has an undercurrent. Few learn to swim in it.",
    },
    {
      quest_title: "The Bridge Builder",
      description:
        "Two people you know disagree about something. Write how you'd mediate: what each actually wants beneath their position, and the common ground sentence you'd offer them.",
      success_criteria: "Both underlying interests identified + a bridging line.",
      hint: "Positions clash. Interests overlap.",
      flavor_text: "Peacemakers see the want beneath the words.",
    },
    {
      quest_title: "The Ask",
      description:
        "There's something you want that requires asking someone. Draft the ask word for word: context, request, and why it's good for them too. Make it impossible to resent.",
      success_criteria: "Complete ask with mutual benefit framed.",
      hint: "The best asks feel like offers.",
      flavor_text: "Fortune favors the well-phrased.",
    },
  ],
  STRATEGIC: [
    {
      quest_title: "The 90-Day Map",
      description:
        "Pick one thing you want to be true in 90 days. Work backwards in writing: the milestone at 60 days, at 30 days, and the single action for this week. Be brutally specific.",
      success_criteria: "Backwards-planned milestones with a concrete weekly action.",
      hint: "Plan backwards. Execute forwards.",
      flavor_text: "The future is built in reverse.",
    },
    {
      quest_title: "Resource Audit",
      description:
        "List your actual current resources — skills, people, time blocks, assets. Then identify in writing the single most under-leveraged one and design one move that uses it this month.",
      success_criteria: "Honest resource list + one leverage move designed.",
      hint: "Your most valuable resource is usually the one you ignore.",
      flavor_text: "Amateurs count what they lack. Strategists count what they hold.",
    },
    {
      quest_title: "The Pre-Mortem",
      description:
        "Take a plan or goal you currently have. Assume it's six months later and it FAILED. Write the story of why — the three most likely causes — then one safeguard for each.",
      success_criteria: "Three plausible failure causes, each with a safeguard.",
      hint: "Pessimism, used precisely, is a planning tool.",
      flavor_text: "See the ambush before you walk the road.",
    },
    {
      quest_title: "Trade-Off Table",
      description:
        "Identify a choice you're facing with no perfect option. Write out what each option costs you, what it buys you, and which cost you can genuinely live with. Decide on paper.",
      success_criteria: "Costs and gains mapped, a decision committed to.",
      hint: "There are no solutions. Only trade-offs chosen well.",
      flavor_text: "Deciding is just choosing which price to pay.",
    },
    {
      quest_title: "The Second Order",
      description:
        "Pick any decision you or someone else made recently. Analyze it in writing: the first-order effect everyone sees, and two second-order effects most people miss.",
      success_criteria: "First-order + two genuine second-order effects.",
      hint: "Ask: 'and then what happens?' — twice.",
      flavor_text: "Novices see moves. Masters see consequences of consequences.",
    },
  ],
};

const MISSION_TEMPLATES: Record<Domain, { title: string; flavor: string; steps: [string, string][] }> = {
  TECHNICAL: {
    title: "Architect of the Invisible",
    flavor: "This week, you stop using systems and start designing one.",
    steps: [
      ["Define the Problem", "Choose one real problem in your life or work worth solving with a system. Describe the problem precisely: who has it, when it hurts, and what 'solved' looks like."],
      ["Design the System", "Design the full solution in writing: components, data flow, user interactions, and the one hardest technical challenge inside it."],
      ["Stress It", "Attack your own design. Write the three most likely ways it breaks or fails users, and how you'd harden each one."],
    ],
  },
  CREATIVE: {
    title: "The Complete Work",
    flavor: "Fragments are easy. This week you finish something.",
    steps: [
      ["The Seed", "Choose one creative idea you've been sitting on. Describe it fully: the form it takes, the feeling it should give, and the audience it's secretly for."],
      ["The Draft", "Create the core of it right here in writing — the story, the design description, the piece itself. Complete, not perfect."],
      ["The Polish", "Revise your draft. Cut something you like. Sharpen the opening and ending. Note in two sentences what changed and why."],
    ],
  },
  ANALYTICAL: {
    title: "The Deep Read",
    flavor: "Anyone can have opinions. This week, you earn one.",
    steps: [
      ["Frame the Question", "Choose one question you genuinely want answered. Define it precisely, list what you already believe, and mark which beliefs are actually assumptions."],
      ["Build the Analysis", "Reason through it in writing: evidence you have, logic connecting it, and the strongest objection to your reasoning."],
      ["Render the Verdict", "Write your conclusion, your confidence level (as a percentage), and what single piece of evidence would change your mind."],
    ],
  },
  SOCIAL: {
    title: "The Influence Map",
    flavor: "This week you study the current beneath your relationships.",
    steps: [
      ["Map the Web", "List the 5 people who most shape your weeks. For each: what flows from them to you, and from you to them."],
      ["Find the Gap", "Identify the one relationship that's under-invested relative to its importance. Analyze in writing why the gap exists."],
      ["Design the Repair", "Write the exact message or conversation you'd use to close that gap — word for word, ready to send."],
    ],
  },
  STRATEGIC: {
    title: "The Campaign",
    flavor: "Goals are wishes until they become campaigns.",
    steps: [
      ["Choose the Hill", "Pick the one objective that would most change your next six months. Define it measurably and write why it beats the alternatives."],
      ["Draw the Lines", "Design the campaign: three phases, the resource each needs, the risk each carries, and the checkpoint that tells you it's working."],
      ["First Blood", "Zoom into the next 7 days. Write the exact actions, in order, with the trigger for each. Make the first one small enough to do today."],
    ],
  },
};

function pickDaily(profile: Profile, seedExtra = 0): QuestTemplate {
  const pool = DAILY_ANGLES[profile.domain];
  const idx =
    (profile.quest_history.length + hashString(profile.user_id) + seedExtra) %
    pool.length;
  return pool[idx];
}

export function mockGenerateQuest(
  profile: Profile,
  questType: Quest["type"],
  difficulty: number
): Omit<Quest, "id" | "status" | "created_at" | "date"> {
  const skills = profile.skills.slice(0, 2).map((s) => s.name);

  if (questType === "calibration") {
    const t = CALIBRATION[profile.domain];
    return {
      ...t,
      description: profile.aspiration && profile.aspiration.toLowerCase() !== "still exploring" ? `Your direction is ${profile.aspiration}. ${t.description}` : t.description,
      type: "calibration", difficulty: 1,
      estimated_time: "3 min", skills_targeted: skills.slice(0, 1),
      grading_type: "llm", steps: [],
    };
  }

  if (questType === "mission" || questType === "prestige") {
    const m = MISSION_TEMPLATES[profile.domain];
    const legendary = questType === "prestige";
    return {
      quest_title: legendary ? `Prestige Trial: ${m.title}` : m.title,
      description: legendary
        ? "A trial reserved for those who reached the summit once already. Three movements. No shortcuts."
        : "A weekly mission. Three steps that build on each other. Take your time — this one counts triple.",
      type: questType, difficulty,
      estimated_time: legendary ? "40 min" : "30 min",
      skills_targeted: skills,
      success_criteria: "All steps completed with genuine depth, each building on the last.",
      hint: "Read all three steps before starting the first.",
      flavor_text: m.flavor,
      grading_type: "llm",
      steps: m.steps.map(([title, prompt], i) => ({
        step_number: i + 1, title, prompt,
        estimated_time: "10 min",
        success_criteria: "Genuine, specific engagement with this step.",
      })),
    };
  }

  if (questType === "weakness") {
    const WEAKNESS_QUESTS: Record<string, QuestTemplate> = {
      poor_focus: {
        quest_title: "One Thing, Fully",
        description: "Pick ONE small topic and write about only that for five minutes. If your mind wanders, note the wander in brackets [like this] and return. The brackets are part of the quest.",
        success_criteria: "Sustained single-topic writing, wanders acknowledged.",
        hint: "The brackets aren't failure. They're data.",
        flavor_text: "Focus isn't the absence of distraction. It's the return.",
      },
      inconsistency: {
        quest_title: "The Smallest Promise",
        description: "Write down one tiny promise you can keep tomorrow — so small it's almost embarrassing. Then write why past bigger promises broke, in two honest sentences.",
        success_criteria: "One micro-promise plus honest reflection.",
        hint: "Shrink it until failure feels impossible.",
        flavor_text: "Consistency is built from promises too small to break.",
      },
      overthinking: {
        quest_title: "First Answer Only",
        description: "Below are three quick questions. Answer each with your FIRST instinct, one sentence, no revisions: 1) What should you do more of? 2) What should you stop? 3) What are you avoiding?",
        success_criteria: "Three instinctive one-sentence answers.",
        hint: "Your first answer knows things your tenth answer forgot.",
        flavor_text: "Sometimes the fastest thought is the truest one.",
      },
      fear_of_failure: {
        quest_title: "The Survivable Worst",
        description: "Name one thing you'd attempt if failure didn't sting. Write the actual worst case — concretely — and then what you'd do the day after it happened.",
        success_criteria: "Concrete worst case + day-after plan.",
        hint: "Fear shrinks when you make it specific.",
        flavor_text: "Every master has a graveyard of attempts behind them.",
      },
      scattered_interests: {
        quest_title: "The Common Thread",
        description: "List every interest currently pulling at you. Then find the single thread connecting most of them — and write which ONE interest, pursued for 30 days, would feed the others.",
        success_criteria: "Honest list + connecting thread + one chosen focus.",
        hint: "Scattered interests usually orbit one hidden sun.",
        flavor_text: "Breadth is a gift. Aim is a choice.",
      },
      laziness: {
        quest_title: "The Two-Minute Door",
        description: "Pick something you've been putting off. Write only the first two minutes of doing it — the literal first actions, step by step. Nothing more.",
        success_criteria: "A genuine two-minute entry plan.",
        hint: "You don't need motivation. You need a door.",
        flavor_text: "Momentum asks only for an opening.",
      },
      decision_paralysis: {
        quest_title: "Decide on Paper",
        description: "Take one decision you've been circling. Set a 3-minute limit. Write the options, circle one criterion that matters most, and commit to a choice in writing before time's up.",
        success_criteria: "A committed choice within the structure.",
        hint: "A decided wrong is often cheaper than an undecided right.",
        flavor_text: "The fork in the road charges rent.",
      },
      external_dependency: {
        quest_title: "Your Own Verdict",
        description: "Think of something you're waiting for someone else's opinion on. Write your OWN full verdict on it first — as if no one else's input existed. Notice how much you already know.",
        success_criteria: "A complete self-formed verdict.",
        hint: "Consult yourself with the seriousness you give others.",
        flavor_text: "The most underrated advisor is the one in the mirror.",
      },
    };
    const t = WEAKNESS_QUESTS[profile.weakness_signal] ?? WEAKNESS_QUESTS.inconsistency;
    return {
      ...t, type: "weakness", difficulty: Math.max(1, difficulty - 1),
      estimated_time: "7 min", skills_targeted: skills.slice(0, 1),
      grading_type: "llm", steps: [],
    };
  }

  // daily / challenge / hidden — pull from daily pool with modifiers
  const t = pickDaily(profile, questType === "hidden" ? 3 : questType === "challenge" ? 7 : 0);
  const isChallenge = questType === "challenge";
  const isHidden = questType === "hidden";
  return {
    quest_title: isHidden ? `??? — ${t.quest_title}` : t.quest_title,
    description: isChallenge
      ? `${t.description}\n\nChallenge condition: go two layers deeper than feels comfortable. Surface-level answers will not clear this one.`
      : t.description,
    type: questType,
    difficulty,
    estimated_time: isChallenge ? "20 min" : isHidden ? "10 min" : "10 min",
    skills_targeted: skills,
    success_criteria: t.success_criteria,
    hint: t.hint,
    flavor_text: isHidden
      ? "A door appears that was not on any map."
      : t.flavor_text,
    grading_type: "llm",
    steps: [],
  };
}

// ── Grading ──────────────────────────────────────────────────────

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
    "You showed up — now bring the rest of you.",
    "There's a real answer underneath this one. Go get it.",
    "Halfway thinking gets halfway results.",
  ],
  Bad: [
    "This wasn't your real effort, and we both know it.",
    "Tomorrow, try answering like it matters.",
    "Low effort in, low growth out. Simple math.",
  ],
  Fail: [
    "Nothing given, nothing gained. Tomorrow is still yours.",
    "A blank effort still teaches — it shows what to change.",
    "Reset. Come back real.",
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
    Bad: `This barely engages with what "${quest.quest_title}" actually asked. The effort reads as minimal — the quest deserved a real attempt.`,
    Fail: `This doesn't engage with the quest. No genuine attempt was made — tomorrow's quest is a clean slate.`,
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
