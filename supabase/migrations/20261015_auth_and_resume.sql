-- Account-owned drafts, protected by the same identity as the saved journey.
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS draft_data JSONB;
CREATE TABLE IF NOT EXISTS public.onboarding_drafts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.onboarding_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_onboarding_draft" ON public.onboarding_drafts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_drafts TO authenticated;
CREATE INDEX IF NOT EXISTS idx_quests_user_active_created ON public.quests(user_id,status,created_at DESC);
