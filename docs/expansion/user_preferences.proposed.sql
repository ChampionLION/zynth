-- PREPARED ONLY, NOT APPLIED OR REGISTERED IN MIGRATION HISTORY.
-- SUPERSEDED by supabase/migrations/20261015204720_evolution_foundation.sql.
-- Do not apply both files.
-- CLI migration generation failed because the machine ran out of disk.
-- Generate with `supabase migration new evolution_preferences`, then copy this
-- SQL into that migration and validate against an isolated database first.
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  motion text NOT NULL DEFAULT 'system' CHECK (motion IN ('system','reduced')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_preferences FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
CREATE POLICY preferences_select ON public.user_preferences FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY preferences_insert ON public.user_preferences FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY preferences_update ON public.user_preferences FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY preferences_delete ON public.user_preferences FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
