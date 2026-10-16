-- APPLY ONLY AS AN AUTHORIZED COORDINATED RELEASE after all server actions,
-- client recovery and separate-connection checks pass. Never apply by itself.
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.profiles,public.quests FROM PUBLIC,anon,authenticated;
-- Remove any historical column-level write grants as well as table grants.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('profiles','quests') LOOP
  EXECUTE format('REVOKE INSERT(%I),UPDATE(%I) ON public.%I FROM PUBLIC,anon,authenticated',c.column_name,c.column_name,c.table_name);
 END LOOP;
END $$;
GRANT SELECT ON public.profiles,public.quests TO authenticated;
GRANT UPDATE(display_name,character_name,leaderboard_opt_out,updated_at) ON public.profiles TO authenticated;
GRANT UPDATE(draft_data) ON public.quests TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.events,public.exploit_log,public.hidden_skill_signals,public.profession_evolutions,public.daily_profile_questions FROM PUBLIC,anon,authenticated;
UPDATE public.journey_configuration SET trusted_writes=true WHERE singleton;
