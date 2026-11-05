import { z } from "zod";

export const DomainEnum = z.enum([
  "ANALYTICAL",
  "TECHNICAL",
  "CREATIVE",
  "SOCIAL",
  "STRATEGIC",
]);

export const LearningStyleEnum = z.enum([
  "Guided Learner",
  "Practical Learner",
  "Analytical Learner",
  "Exploratory Learner",
]);

export const WeaknessEnum = z.enum([
  "poor_focus",
  "inconsistency",
  "overthinking",
  "fear_of_failure",
  "scattered_interests",
  "laziness",
  "decision_paralysis",
  "external_dependency",
]);

export const GradeEnum = z.enum(["Excellent", "Good", "Basic", "Bad", "Fail"]);

export const StatsSchema = z.object({
  focus: z.number().min(1).max(30),
  consistency: z.number().min(1).max(30),
  adaptability: z.number().min(1).max(30),
  execution: z.number().min(1).max(30),
  stat_5: z.object({ name: z.string(), value: z.number() }),
  stat_6: z.object({ name: z.string(), value: z.number() }),
});

export const OnboardingResultSchema = z.object({
  profession: z.string().min(2),
  domain: DomainEnum,
  domain_confidence: z.number().min(0).max(1),
  learning_style: LearningStyleEnum,
  behavior_signature: z.string().min(2),
  weakness_signal: WeaknessEnum,
  stats: StatsSchema.refine(stats => {
    const values=[stats.focus,stats.consistency,stats.adaptability,stats.execution,stats.stat_5.value,stats.stat_6.value];
    const sum=values.reduce((a,b)=>a+b,0);
    return values.every(v=>Number.isInteger(v)&&v>=4&&v<=10)&&new Set(values).size===6&&sum>=42&&sum<=52;
  }, "Onboarding stats must be unique integers from 4 to 10 totaling 42 to 52"),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.number().default(1),
        exp: z.number().default(0),
      })
    )
    .min(3).max(5),
});

export const QuestStepSchema = z.object({
  step_number: z.number(),
  title: z.string(),
  prompt: z.string(),
  estimated_time: z.string(),
  success_criteria: z.string(),
});

export const QuestLearningSchema = z.object({
  version: z.literal(1),
  objective: z.string().trim().min(10).max(400),
  lessons: z.array(z.object({title:z.string().trim().min(3).max(120),explanation:z.string().trim().min(50).max(1200),example:z.string().trim().min(20).max(800)})).min(1).max(2),
  check: z.object({
    question:z.string().trim().min(20).max(1000),
    options:z.array(z.object({key:z.enum(["A","B","C"]),label:z.string().trim().min(1).max(400)})).min(2).max(3),
    correct_option:z.enum(["A","B","C"]),explanation:z.string().trim().min(20).max(800),
  }).refine(check=>new Set(check.options.map(o=>o.key)).size===check.options.length&&new Set(check.options.map(o=>o.label.toLowerCase())).size===check.options.length&&check.options.some(o=>o.key===check.correct_option),"Provide distinct options and a matching answer key"),
}).refine(content=>new Set(content.lessons.map(lesson=>lesson.title.toLowerCase())).size===content.lessons.length,"Teach distinct lessons");

export const QuestResultSchema = z.object({
  learning: QuestLearningSchema.optional(),
  scenario: z.string().trim().min(80).max(3000).optional(),
  assessment_topics: z.array(z.string().trim().min(2).max(120)).max(14).optional(),
  quest_title: z.string().min(2),
  description: z.string().min(10),
  type: z.string(),
  difficulty: z.number(),
  estimated_time: z.string(),
  skills_targeted: z.array(z.string()),
  success_criteria: z.string(),
  hint: z.string(),
  flavor_text: z.string(),
  grading_type: z.string().default("llm"),
  steps: z.array(QuestStepSchema).default([]),
});

export const GradeResultSchema = z.object({
  grade: GradeEnum,
  feedback: z.string(),
  mentor_line: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  behavioral_signals: z.object({
    response_depth: z.enum(["thorough", "adequate", "shallow", "rushed"]),
    domain_relevance: z.enum(["high", "medium", "low"]),
    difficulty_handled: z.enum(["exceeded", "met", "struggled"]),
    completion_quality: z.enum(["strong", "adequate", "weak"]),
  }),
  skill_progress: z.array(
    z.object({
      name: z.string(),
      exp_signal: z.enum(["high", "medium", "low"]),
    })
  ),
  hidden_quest_triggered: z.boolean().default(false),
  skill_evolution_signal: z.string().nullable().default(null),
});

export const DailyQuestionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .min(2)
    .max(6),
  category: z.string(),
  signals_mined: z.string().default(""),
});
