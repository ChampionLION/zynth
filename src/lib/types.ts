// ─── Zynth Core Types ────────────────────────────────────────────

export type Domain =
  | "ANALYTICAL"
  | "TECHNICAL"
  | "CREATIVE"
  | "SOCIAL"
  | "STRATEGIC";

export type LearningStyle =
  | "Guided Learner"
  | "Practical Learner"
  | "Analytical Learner"
  | "Exploratory Learner";

export type WeaknessSignal =
  | "poor_focus"
  | "inconsistency"
  | "overthinking"
  | "fear_of_failure"
  | "scattered_interests"
  | "laziness"
  | "decision_paralysis"
  | "external_dependency";

export type Grade = "Excellent" | "Good" | "Basic" | "Bad" | "Fail";

export type QuestType =
  | "calibration"
  | "daily"
  | "mission"
  | "challenge"
  | "hidden"
  | "weakness"
  | "prestige";

export type AdaptiveState =
  | "optimal"
  | "bored"
  | "burned_out"
  | "stagnant"
  | "struggling"
  | "returning"
  | "peaking";

export type ExploitSeverity = "warn" | "soft_block" | "hard_block" | "ban_review";

export interface Skill {
  name: string;
  level: number;
  exp: number;
  evolutions?: string[]; // past names
  timesTargeted?: number;
}

export interface HiddenSkill {
  name: string;
  level: number;
  discovered: boolean;
  discovered_at?: string;
  discovery_message?: string;
}

export interface DomainStat {
  name: string;
  value: number;
}

export interface Stats {
  focus: number;
  consistency: number;
  adaptability: number;
  execution: number;
  stat_5: DomainStat;
  stat_6: DomainStat;
}

export interface BehaviorLogEntry {
  date: string;
  grade: Grade;
  quest_type: QuestType;
  response_depth: "thorough" | "adequate" | "shallow" | "rushed";
  domain_relevance: "high" | "medium" | "low";
  difficulty_handled: "exceeded" | "met" | "struggled";
  completion_quality: "strong" | "adequate" | "weak";
  completedSameDay: boolean;
  skippedWithoutToken?: boolean;
  returnedAfterBreak?: boolean;
}

export interface QuestHistoryEntry {
  quest_id: string;
  quest_title: string;
  quest_type: QuestType;
  grade: Grade;
  exp_earned: number;
  skills_targeted: string[];
  completed_at: string;
  feedback?: string;
  mentor_line?: string;
  response?: string;
  swift_mode_used?: boolean;
  response_time_seconds?: number;
}

export interface Milestone {
  type: string;
  date: string;
  [key: string]: unknown;
}

export interface Memory {
  milestones: Milestone[];
  stat_history: { at_level: number; stats: Record<string, number>; date: string }[];
  skill_history: { skill_name: string; evolutions: string[]; current_level: number }[];
  pattern_summary: string | null;
  struggle_log: {
    quest_type: string;
    domain: string;
    fail_count: number;
    eventually_passed: boolean;
  }[];
  personal_bests: {
    highest_streak: number;
    most_exp_in_day: number;
    highest_skill_level: { name: string; level: number };
    fastest_level_up: { from_level: number; to_level: number; quests_taken: number };
  };
}

export interface XPCardEntry {
  earned_at: string;
  expires_at: string;
  source: string;
  count: number;
}

export interface ExploitFlag {
  flag_type: string;
  severity: ExploitSeverity;
  at: string;
}

export interface ContinuousProfileAnswer {
  question: string;
  category: string;
  answer_key: string | null; // null = skipped
  answer_label: string | null;
  signals_mined: string;
  answered_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string;
  aspiration?: string | null; // Added in schema v2; absent on existing profiles.
  // Identity (LLM-generated)
  profession: string;
  domain: Domain;
  domain_confidence: number;
  learning_style: LearningStyle;
  behavior_signature: string;
  weakness_signal: WeaknessSignal;
  title: string;
  schema_version: number;
  // Progression
  level: number;
  exp: number;
  exp_to_next: number;
  cumulative_exp: number;
  prestige: number;
  prestige_exp_bonus: number;
  // Engagement
  streak: number;
  streak_best: number;
  last_active: string;
  last_quest_date: string | null;
  tokens: number;
  xp_cards: number;
  xp_card_log: XPCardEntry[];
  swift_mode_unlocked: boolean;
  current_adaptive_state: AdaptiveState;
  adaptive_state_updated_at: string;
  energy_today: "high" | "mid" | "low" | null;
  energy_date: string | null;
  // Data blobs
  stats: Stats;
  onboarding_stats: Stats;
  skills: Skill[];
  hidden_skills: HiddenSkill[];
  behavior_log: BehaviorLogEntry[];
  behavior_summary_cache: string | null;
  behavior_summary_quest_count: number;
  unlocks: string[];
  quest_history: QuestHistoryEntry[];
  exploit_flags: ExploitFlag[];
  memory: Memory;
  continuous_profile_answers: ContinuousProfileAnswer[];
  achievements_unlocked: string[];
  hidden_skill_counters: Record<string, number>;
  exp_earned_today: number;
  exp_today_date: string | null;
  // Leaderboard
  leaderboard_opt_out: boolean;
  // Character
  character_name: string | null;
  character_gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestStep {
  step_number: number;
  title: string;
  prompt: string;
  estimated_time: string;
  success_criteria: string;
}

export interface Quest {
  id: string;
  quest_title: string;
  description: string;
  type: QuestType;
  difficulty: number;
  estimated_time: string;
  skills_targeted: string[];
  success_criteria: string;
  hint: string;
  flavor_text: string;
  grading_type: string;
  steps: QuestStep[];
  status: "active" | "completed" | "skipped" | "rejected";
  created_at: string;
  date: string; // YYYY-MM-DD the quest belongs to
}

export interface GradeResult {
  grade: Grade;
  feedback: string;
  mentor_line: string;
  strengths: string[];
  improvements: string[];
  behavioral_signals: {
    response_depth: BehaviorLogEntry["response_depth"];
    domain_relevance: BehaviorLogEntry["domain_relevance"];
    difficulty_handled: BehaviorLogEntry["difficulty_handled"];
    completion_quality: BehaviorLogEntry["completion_quality"];
  };
  skill_progress: { name: string; exp_signal: "high" | "medium" | "low" }[];
  hidden_quest_triggered: boolean;
  skill_evolution_signal: string | null;
}

export type ZynthEvent =
  | { kind: "level_up"; from: number; to: number; newTitle: string | null; unlocks: string[] }
  | { kind: "skill_evolution"; skill: string; oldName: string; newName: string; tier: number }
  | { kind: "hidden_skill"; skill: string; message: string }
  | { kind: "streak_milestone"; streak: number; multiplier: number; tokenAwarded: boolean }
  | { kind: "weakness_overcome"; stat: string; oldSignature: string; newSignature: string }
  | { kind: "achievement"; id: string; name: string; rarity: string; cards: number }
  | { kind: "profession_evolution"; from: string; to: string };

export interface OnboardingAnswers {
  // Q1 contains the written aspiration; Q2–Q5 contain primary/secondary option keys.
  Q1: string[];
  Q2: string[];
  Q3: string[];
  Q4: string[];
  Q5: string[];
}

export interface LLMProfileResult {
  profession: string;
  domain: Domain;
  domain_confidence: number;
  learning_style: LearningStyle;
  behavior_signature: string;
  weakness_signal: WeaknessSignal;
  stats: Stats;
  skills: { name: string; level: number; exp: number }[];
}

export interface DailyQuestion {
  question: string;
  options: { key: string; label: string }[];
  category: string;
  signals_mined: string;
}

export interface LeaderboardRow {
  rank: number;
  display_name: string;
  domain: Domain;
  level: number;
  score: number;
  streak: number;
  is_user?: boolean;
}
