-- Prepared locally. Production application requires separate authorization.
-- This additive foundation does NOT activate trusted mode or revoke legacy
-- profile writes; the coordinated route/privilege cutover is a separate phase.

CREATE TABLE public.user_preferences (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
 motion text NOT NULL DEFAULT 'system' CHECK (motion IN ('system','reduced')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_preferences FROM PUBLIC, anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_preferences TO authenticated,service_role;
CREATE POLICY preferences_select ON public.user_preferences FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY preferences_insert ON public.user_preferences FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY preferences_update ON public.user_preferences FOR UPDATE TO authenticated USING ((SELECT auth.uid())=user_id) WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY preferences_delete ON public.user_preferences FOR DELETE TO authenticated USING ((SELECT auth.uid())=user_id);

ALTER TABLE public.profiles ADD COLUMN progression_revision bigint NOT NULL DEFAULT 0 CHECK (progression_revision>=0);
GRANT SELECT,UPDATE ON public.profiles,public.quests TO service_role;
CREATE FUNCTION public.advance_progression_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.progression_revision=OLD.progression_revision+1; RETURN NEW; END;
$$;
REVOKE ALL ON FUNCTION public.advance_progression_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER profile_revision BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.advance_progression_revision();

CREATE TABLE public.quest_outcomes (
 user_id uuid NOT NULL REFERENCES public.profiles(user_id),
 quest_id uuid NOT NULL REFERENCES public.quests(id),
 result jsonb NOT NULL CHECK (jsonb_typeof(result)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,quest_id)
);
CREATE INDEX quest_outcomes_owner_time ON public.quest_outcomes(user_id,created_at DESC,quest_id);
ALTER TABLE public.quest_outcomes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quest_outcomes FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.quest_outcomes TO authenticated;
GRANT ALL ON public.quest_outcomes TO service_role;
CREATE POLICY own_quest_outcomes ON public.quest_outcomes FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);

CREATE TABLE public.progression_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(user_id),
 source_quest_id uuid NOT NULL REFERENCES public.quests(id),
 event_index integer NOT NULL CHECK (event_index>=0),
 kind text NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,source_quest_id,event_index)
);
CREATE INDEX progression_events_owner_time ON public.progression_events(user_id,created_at DESC,id);
ALTER TABLE public.progression_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.progression_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.progression_events TO authenticated;
GRANT ALL ON public.progression_events TO service_role;
CREATE POLICY own_progression_events ON public.progression_events FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);

CREATE TABLE public.quest_submission_leases (
 user_id uuid NOT NULL REFERENCES public.profiles(user_id),quest_id uuid NOT NULL REFERENCES public.quests(id),
 lease_id uuid NOT NULL,expires_at timestamptz NOT NULL,PRIMARY KEY(user_id,quest_id)
);
ALTER TABLE public.quest_submission_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quest_submission_leases FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.quest_submission_leases TO service_role;
CREATE FUNCTION public.claim_quest_submission(p_user_id uuid,p_quest_id uuid,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.quests WHERE user_id=p_user_id AND id=p_quest_id AND status='active') THEN RETURN false; END IF;
 INSERT INTO public.quest_submission_leases(user_id,quest_id,lease_id,expires_at)
 VALUES(p_user_id,p_quest_id,p_lease_id,pg_catalog.clock_timestamp()+interval '2 minutes')
 ON CONFLICT(user_id,quest_id) DO UPDATE SET lease_id=excluded.lease_id,expires_at=excluded.expires_at
 WHERE public.quest_submission_leases.expires_at<pg_catalog.clock_timestamp();
 RETURN FOUND;
END; $$;
CREATE FUNCTION public.release_quest_submission(p_user_id uuid,p_quest_id uuid,p_lease_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN DELETE FROM public.quest_submission_leases WHERE user_id=p_user_id AND quest_id=p_quest_id AND lease_id=p_lease_id; END; $$;
REVOKE ALL ON FUNCTION public.claim_quest_submission(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.release_quest_submission(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_quest_submission(uuid,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_quest_submission(uuid,uuid,uuid) TO service_role;

-- Only trusted server application code may supply computed profile/grade math.
-- No SECURITY DEFINER and no execution grant to browser roles.
CREATE FUNCTION public.commit_quest_result(p_user_id uuid,p_quest_id uuid,p_expected_revision bigint,p_profile jsonb,p_result jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE current_profile public.profiles; next_profile public.profiles; active_quest public.quests; prior_result jsonb; grade_value text;
BEGIN
 SELECT * INTO current_profile FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found' USING ERRCODE='P0002'; END IF;
 SELECT result INTO prior_result FROM public.quest_outcomes WHERE user_id=p_user_id AND quest_id=p_quest_id;
 IF FOUND THEN RETURN pg_catalog.jsonb_build_object('replayed',true,'profile',pg_catalog.to_jsonb(current_profile),'result',prior_result); END IF;
 IF current_profile.progression_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Profile version changed' USING ERRCODE='40001'; END IF;
 IF p_profile->>'user_id' IS DISTINCT FROM p_user_id::text THEN RAISE EXCEPTION 'Profile owner mismatch' USING ERRCODE='42501'; END IF;
 grade_value=p_result->'gradeResult'->>'grade';
 IF grade_value IS NULL OR grade_value NOT IN ('Excellent','Good','Basic','Bad','Fail') OR pg_catalog.jsonb_typeof(p_result->'events') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Invalid trusted result' USING ERRCODE='22023';
 END IF;
 SELECT * INTO active_quest FROM public.quests WHERE id=p_quest_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR active_quest.status<>'active' THEN RAISE EXCEPTION 'Active quest not found' USING ERRCODE='P0002'; END IF;
 SELECT * INTO next_profile FROM pg_catalog.jsonb_populate_record(current_profile,p_profile);
 -- Editable settings and immutable identity keys are deliberately preserved.
 UPDATE public.profiles SET
  profession=next_profile.profession,aspiration=next_profile.aspiration,domain=next_profile.domain,
  domain_confidence=next_profile.domain_confidence,learning_style=next_profile.learning_style,
  behavior_signature=next_profile.behavior_signature,weakness_signal=next_profile.weakness_signal,
  title=next_profile.title,schema_version=next_profile.schema_version,level=next_profile.level,
  exp=next_profile.exp,exp_to_next=next_profile.exp_to_next,cumulative_exp=next_profile.cumulative_exp,
  prestige=next_profile.prestige,prestige_exp_bonus=next_profile.prestige_exp_bonus,streak=next_profile.streak,
  streak_best=next_profile.streak_best,last_active=next_profile.last_active,last_quest_date=next_profile.last_quest_date,
  tokens=next_profile.tokens,xp_cards=next_profile.xp_cards,xp_card_log=next_profile.xp_card_log,
  swift_mode_unlocked=next_profile.swift_mode_unlocked,current_adaptive_state=next_profile.current_adaptive_state,
  adaptive_state_updated_at=next_profile.adaptive_state_updated_at,energy_today=next_profile.energy_today,
  energy_date=next_profile.energy_date,stats=next_profile.stats,onboarding_stats=next_profile.onboarding_stats,
  skills=next_profile.skills,hidden_skills=next_profile.hidden_skills,behavior_log=next_profile.behavior_log,
  behavior_summary_cache=next_profile.behavior_summary_cache,behavior_summary_quest_count=next_profile.behavior_summary_quest_count,
  unlocks=next_profile.unlocks,quest_history=next_profile.quest_history,exploit_flags=next_profile.exploit_flags,
  memory=next_profile.memory,continuous_profile_answers=next_profile.continuous_profile_answers,
  achievements_unlocked=next_profile.achievements_unlocked,hidden_skill_counters=next_profile.hidden_skill_counters,
  exp_earned_today=next_profile.exp_earned_today,exp_today_date=next_profile.exp_today_date,updated_at=pg_catalog.clock_timestamp()
 WHERE user_id=p_user_id RETURNING * INTO current_profile;
 UPDATE public.quests SET status='completed',completed_at=pg_catalog.clock_timestamp(),grade=grade_value,
  response=pg_catalog.left(p_result->>'responseText',24000),exp_earned=(p_result->>'expEarned')::integer,
  behavioral_signals=p_result->'gradeResult'->'behavioral_signals',draft_data=NULL
 WHERE id=p_quest_id AND user_id=p_user_id;
 INSERT INTO public.quest_outcomes(user_id,quest_id,result) VALUES(p_user_id,p_quest_id,p_result-'profile'-'responseText');
 INSERT INTO public.progression_events(user_id,source_quest_id,event_index,kind,payload)
 SELECT p_user_id,p_quest_id,(ordinality-1)::integer,value->>'kind',value
 FROM pg_catalog.jsonb_array_elements(p_result->'events') WITH ORDINALITY;
 RETURN pg_catalog.jsonb_build_object('replayed',false,'profile',pg_catalog.to_jsonb(current_profile),'result',p_result-'profile'-'responseText');
END;
$$;
REVOKE ALL ON FUNCTION public.commit_quest_result(uuid,uuid,bigint,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_quest_result(uuid,uuid,bigint,jsonb,jsonb) TO service_role;
