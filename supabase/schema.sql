-- ═══ ZYNTH — Supabase schema (Blueprint v1) ═════════════════════
-- Run this in the Supabase SQL editor when switching to live mode.

-- ─── PROFILES ────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID REFERENCES auth.users(id) UNIQUE,
  display_name                  TEXT,
  -- Identity
  profession                    TEXT NOT NULL,
  aspiration                    TEXT,
  domain                        TEXT NOT NULL,
  domain_confidence             FLOAT,
  learning_style                TEXT NOT NULL,
  behavior_signature            TEXT NOT NULL,
  weakness_signal               TEXT,
  title                         TEXT DEFAULT 'Initiate',
  schema_version                INTEGER DEFAULT 1,
  -- Progression
  level                         INTEGER DEFAULT 1,
  exp                           INTEGER DEFAULT 0,
  exp_to_next                   INTEGER DEFAULT 41,
  cumulative_exp                INTEGER DEFAULT 0,
  prestige                      INTEGER DEFAULT 0,
  prestige_exp_bonus            FLOAT DEFAULT 1.0,
  -- Engagement
  streak                        INTEGER DEFAULT 0,
  streak_best                   INTEGER DEFAULT 0,
  last_active                   TIMESTAMPTZ DEFAULT NOW(),
  last_quest_date               TEXT,
  tokens                        INTEGER DEFAULT 3,
  xp_cards                      INTEGER DEFAULT 0,
  xp_card_log                   JSONB DEFAULT '[]',
  swift_mode_unlocked           BOOLEAN DEFAULT FALSE,
  current_adaptive_state        TEXT DEFAULT 'optimal',
  adaptive_state_updated_at     TIMESTAMPTZ DEFAULT NOW(),
  energy_today                  TEXT,
  energy_date                   TEXT,
  -- JSON blobs
  stats                         JSONB NOT NULL,
  onboarding_stats              JSONB NOT NULL,
  skills                        JSONB DEFAULT '[]',
  hidden_skills                 JSONB DEFAULT '[]',
  behavior_log                  JSONB DEFAULT '[]',
  behavior_summary_cache        TEXT,
  behavior_summary_quest_count  INTEGER DEFAULT 0,
  unlocks                       JSONB DEFAULT '[]',
  quest_history                 JSONB DEFAULT '[]',
  exploit_flags                 JSONB DEFAULT '[]',
  memory                        JSONB DEFAULT '{}',
  continuous_profile_answers    JSONB DEFAULT '[]',
  achievements_unlocked         JSONB DEFAULT '[]',
  hidden_skill_counters         JSONB DEFAULT '{}',
  exp_earned_today              INTEGER DEFAULT 0,
  exp_today_date                TEXT,
  -- Leaderboard
  leaderboard_opt_out           BOOLEAN DEFAULT FALSE,
  -- Character
  character_name                TEXT,
  character_gender              TEXT,
  character_avatar              TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── QUESTS ──────────────────────────────────────────────────────
CREATE TABLE quests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id),
  quest_data          JSONB NOT NULL,
  quest_type          TEXT NOT NULL,
  difficulty          INTEGER NOT NULL,
  status              TEXT DEFAULT 'active',
  is_multi_step       BOOLEAN DEFAULT FALSE,
  steps               JSONB DEFAULT '[]',
  step_responses      JSONB DEFAULT '[]',
  current_step        INTEGER DEFAULT 0,
  response            TEXT,
  grade               TEXT,
  points              INTEGER,
  exp_earned          INTEGER,
  behavioral_signals  JSONB,
  swift_mode_used     BOOLEAN DEFAULT FALSE,
  retest_count        INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- ─── EVENTS ──────────────────────────────────────────────────────
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXPLOIT LOG ─────────────────────────────────────────────────
CREATE TABLE exploit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  flag_type   TEXT NOT NULL,
  severity    TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HIDDEN SKILL SIGNALS ────────────────────────────────────────
CREATE TABLE hidden_skill_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  signal_type TEXT NOT NULL,
  signal_data JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFESSION EVOLUTIONS ───────────────────────────────────────
CREATE TABLE profession_evolutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id),
  from_profession   TEXT,
  to_profession     TEXT,
  triggering_skills JSONB,
  trigger_type      TEXT, -- 'hidden_skills' or 'leaderboard'
  evolved_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADERBOARD CACHE ───────────────────────────────────────────
CREATE TABLE leaderboard_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type   TEXT NOT NULL, -- 'global_all', 'global_technical', etc.
  user_id      UUID REFERENCES auth.users(id),
  display_name TEXT,
  rank         INTEGER,
  score        INTEGER,
  domain       TEXT,
  level        INTEGER,
  streak       INTEGER,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DAILY PROFILE QUESTIONS ─────────────────────────────────────
CREATE TABLE daily_profile_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  question    TEXT NOT NULL,
  options     JSONB NOT NULL,
  category    TEXT NOT NULL,
  answer_key  TEXT,
  skipped     BOOLEAN DEFAULT FALSE,
  asked_at    TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- ─── INDEXES ─────────────────────────────────────────────────────
CREATE INDEX idx_quests_user_id       ON quests(user_id);
CREATE INDEX idx_quests_status        ON quests(status);
CREATE INDEX idx_events_user_id       ON events(user_id);
CREATE INDEX idx_events_type          ON events(event_type);
CREATE INDEX idx_hss_user_id          ON hidden_skill_signals(user_id);
CREATE INDEX idx_leaderboard_type     ON leaderboard_cache(board_type);
CREATE INDEX idx_leaderboard_rank     ON leaderboard_cache(rank);
CREATE INDEX idx_dpq_user_id          ON daily_profile_questions(user_id);
CREATE INDEX idx_profiles_cumexp      ON profiles(cumulative_exp DESC);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exploit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_skill_signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profession_evolutions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_profile_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"    ON profiles                FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_quests"     ON quests                  FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_events"     ON events                  FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_exploits"   ON exploit_log             FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_hss"        ON hidden_skill_signals    FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_evolutions" ON profession_evolutions   FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "own_dpq"        ON daily_profile_questions FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "read_leaderboard" ON leaderboard_cache     FOR SELECT USING (true);

-- ─── LEADERBOARD EDGE FUNCTION (pseudocode reference) ────────────
-- Deploy as a Supabase Edge Function on a daily cron (midnight UTC):
--   1. SELECT user_id, display_name, domain, level, streak, cumulative_exp
--      FROM profiles WHERE cumulative_exp > 0 AND NOT leaderboard_opt_out
--   2. Rank by cumulative_exp overall → board_type 'global_all'
--   3. Rank within each domain → 'global_technical', 'global_creative', ...
--   4. TRUNCATE leaderboard_cache; bulk INSERT new ranks
--   5. Update profession evolution eligibility flags
