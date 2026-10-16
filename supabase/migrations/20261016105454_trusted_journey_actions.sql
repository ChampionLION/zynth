-- Local preparation only. Requires evolution_foundation before this migration.
-- All numerical inputs below come from authenticated server application code.
CREATE TABLE public.journey_actions (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 action_key text NOT NULL CHECK(length(action_key) BETWEEN 1 AND 180),
 kind text NOT NULL, input jsonb NOT NULL, plan jsonb NOT NULL DEFAULT '{}',
 lease_id uuid, expires_at timestamptz, result jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,action_key)
);
CREATE TABLE public.journey_legacy_snapshots (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('cloud_baseline','browser_archive')),
 snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,source)
);
CREATE TABLE public.journey_mission_state (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id),
 state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.journey_rate_limits (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 purpose text NOT NULL, bucket timestamptz NOT NULL, attempts integer NOT NULL,
 PRIMARY KEY(user_id,purpose,bucket)
);
CREATE TABLE public.journey_configuration (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 trusted_writes boolean NOT NULL DEFAULT false
);
CREATE TABLE public.journey_reset_receipts (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,request_id)
);
INSERT INTO public.journey_configuration(singleton,trusted_writes) VALUES(true,false);
ALTER TABLE public.quest_outcomes ADD COLUMN revealed_at timestamptz,
 ADD COLUMN event_cursor integer NOT NULL DEFAULT 0 CHECK(event_cursor>=0),
 ADD COLUMN provenance text NOT NULL DEFAULT 'legacy' CHECK(provenance IN ('legacy','server'));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['journey_actions','journey_legacy_snapshots','journey_mission_state','journey_rate_limits','journey_configuration','journey_reset_receipts'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
GRANT SELECT ON public.journey_legacy_snapshots,public.journey_mission_state TO authenticated;
CREATE POLICY own_legacy_snapshots ON public.journey_legacy_snapshots FOR SELECT TO authenticated USING((SELECT auth.uid())=user_id);
CREATE POLICY own_mission_state ON public.journey_mission_state FOR SELECT TO authenticated USING((SELECT auth.uid())=user_id);
GRANT INSERT,DELETE ON public.profiles,public.quests TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.onboarding_drafts,public.profession_evolutions TO service_role;

CREATE FUNCTION public.consume_journey_budget(p_user_id uuid,p_purpose text,p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE used integer; BEGIN
 IF p_limit<1 OR p_limit>60 THEN RAISE EXCEPTION 'Invalid budget'; END IF;
 DELETE FROM public.journey_rate_limits WHERE user_id=p_user_id AND bucket<now()-interval '1 day';
 INSERT INTO public.journey_rate_limits(user_id,purpose,bucket,attempts)
 VALUES(p_user_id,p_purpose,date_trunc('minute',clock_timestamp()),1)
 ON CONFLICT(user_id,purpose,bucket) DO UPDATE SET attempts=public.journey_rate_limits.attempts+1
 RETURNING attempts INTO used;
 RETURN used<=p_limit;
END $$;

CREATE FUNCTION public.claim_journey_action(p_user_id uuid,p_key text,p_kind text,p_input jsonb,p_plan jsonb,p_lease uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE a public.journey_actions; BEGIN
 INSERT INTO public.journey_actions(user_id,action_key,kind,input,plan)
 VALUES(p_user_id,p_key,p_kind,p_input,p_plan) ON CONFLICT DO NOTHING;
 SELECT * INTO a FROM public.journey_actions WHERE user_id=p_user_id AND action_key=p_key FOR UPDATE;
 IF a.kind IS DISTINCT FROM p_kind OR a.input IS DISTINCT FROM p_input THEN
  RAISE EXCEPTION 'This request already has different input' USING ERRCODE='22023';
 END IF;
 IF a.result IS NOT NULL THEN RETURN jsonb_build_object('status','complete','result',a.result,'plan',a.plan); END IF;
 IF a.lease_id IS NOT NULL AND a.expires_at>clock_timestamp() THEN RETURN jsonb_build_object('status','busy','plan',a.plan); END IF;
 UPDATE public.journey_actions SET lease_id=p_lease,expires_at=clock_timestamp()+interval '2 minutes'
 WHERE user_id=p_user_id AND action_key=p_key;
 RETURN jsonb_build_object('status','claimed','plan',a.plan);
END $$;
CREATE FUNCTION public.release_journey_action(p_user_id uuid,p_key text,p_lease uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 UPDATE public.journey_actions SET lease_id=NULL,expires_at=NULL WHERE user_id=p_user_id AND action_key=p_key AND lease_id=p_lease AND result IS NULL;
$$;

-- Internal CAS helper. It cannot overwrite editable settings or identity keys.
CREATE FUNCTION public.apply_journey_profile(p_user_id uuid,p_revision bigint,p_profile jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE old public.profiles; columns text; values_sql text; answer jsonb; BEGIN
 SELECT * INTO old FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found' USING ERRCODE='P0002'; END IF;
 IF old.progression_revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Profile version changed' USING ERRCODE='40001'; END IF;
 IF p_profile->>'user_id' IS DISTINCT FROM p_user_id::text THEN RAISE EXCEPTION 'Owner mismatch' USING ERRCODE='42501'; END IF;
 SELECT string_agg(quote_ident(attname),',' ORDER BY attnum),string_agg('n.'||quote_ident(attname),',' ORDER BY attnum)
 INTO columns,values_sql FROM pg_catalog.pg_attribute WHERE attrelid='public.profiles'::regclass AND attnum>0 AND NOT attisdropped
 AND attname NOT IN ('id','user_id','created_at','updated_at','progression_revision','display_name','character_name','character_gender','character_avatar','leaderboard_opt_out');
 EXECUTE format('UPDATE public.profiles p SET (%s)=(SELECT %s FROM pg_catalog.jsonb_populate_record(NULL::public.profiles,$1) n),updated_at=clock_timestamp() WHERE p.user_id=$2 RETURNING to_jsonb(p)',columns,values_sql)
 INTO answer USING to_jsonb(old)||p_profile,p_user_id;
 RETURN answer;
END $$;

CREATE FUNCTION public.commit_journey_action(p_user_id uuid,p_key text,p_lease uuid,p_revision bigint,p_profile jsonb,p_quest jsonb,p_extra jsonb,p_mission jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE a public.journey_actions; old public.profiles; next_profile public.profiles; q public.quests; answer jsonb; saved_profile jsonb; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO old FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 SELECT * INTO a FROM public.journey_actions WHERE user_id=p_user_id AND action_key=p_key FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request missing' USING ERRCODE='P0002'; END IF;
 IF a.result IS NOT NULL THEN RETURN a.result; END IF;
 IF a.lease_id IS DISTINCT FROM p_lease OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Request lease expired' USING ERRCODE='40001'; END IF;
 IF a.kind='onboard' THEN
  IF old.user_id IS NULL THEN
   IF p_profile->>'user_id' IS DISTINCT FROM p_user_id::text OR (p_profile->>'level')::int<>1 OR (p_profile->>'cumulative_exp')::int<>0 THEN RAISE EXCEPTION 'Invalid starting profile'; END IF;
   SELECT * INTO next_profile FROM jsonb_populate_record(NULL::public.profiles,p_profile||jsonb_build_object('id',gen_random_uuid(),'progression_revision',0,'created_at',clock_timestamp(),'updated_at',clock_timestamp()));
   INSERT INTO public.profiles SELECT next_profile.* RETURNING to_jsonb(profiles) INTO saved_profile;
   DELETE FROM public.onboarding_drafts WHERE user_id=p_user_id;
  ELSE saved_profile:=to_jsonb(old); END IF;
 ELSIF a.kind='legacy_archive' THEN
  INSERT INTO public.journey_legacy_snapshots(user_id,source,snapshot) VALUES(p_user_id,'browser_archive',a.input) ON CONFLICT DO NOTHING;
  saved_profile:=CASE WHEN old.user_id IS NULL THEN NULL ELSE to_jsonb(old) END;
 ELSIF a.kind='daily_question' THEN saved_profile:=to_jsonb(old);
 ELSE
  IF old.user_id IS NULL THEN RAISE EXCEPTION 'Profile not found' USING ERRCODE='P0002'; END IF;
  IF old.progression_revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Profile version changed' USING ERRCODE='40001'; END IF;
  -- A preserved legacy snapshot is not evidence for future permanent grants.
  INSERT INTO public.journey_legacy_snapshots(user_id,source,snapshot) VALUES(p_user_id,'cloud_baseline',to_jsonb(old)) ON CONFLICT DO NOTHING;
  IF a.kind='generate' THEN
   SELECT * INTO q FROM public.quests WHERE user_id=p_user_id AND status='active' ORDER BY created_at DESC,id LIMIT 1 FOR UPDATE;
   IF q.id IS NULL THEN
    IF EXISTS(SELECT 1 FROM public.quests WHERE id=(p_quest->>'id')::uuid) THEN RAISE EXCEPTION 'Plan already resolved' USING ERRCODE='40001'; END IF;
    INSERT INTO public.quests(id,user_id,quest_data,quest_type,difficulty,status,is_multi_step,steps,created_at)
    VALUES((p_quest->>'id')::uuid,p_user_id,p_quest,p_quest->>'type',(p_quest->>'difficulty')::int,'active',jsonb_array_length(p_quest->'steps')>0,p_quest->'steps',clock_timestamp()) RETURNING * INTO q;
   END IF;
   p_quest:=q.quest_data||jsonb_build_object('id',q.id,'status',q.status,'created_at',q.created_at);
  ELSIF a.kind='skip' THEN
   SELECT * INTO q FROM public.quests WHERE id=(a.input->>'questId')::uuid AND user_id=p_user_id FOR UPDATE;
   IF q.id IS NULL OR q.status<>'active' OR EXISTS(SELECT 1 FROM public.quest_outcomes WHERE user_id=p_user_id AND quest_id=q.id) THEN RAISE EXCEPTION 'Challenge is no longer active' USING ERRCODE='40001'; END IF;
   UPDATE public.quests SET status='skipped',draft_data=NULL WHERE id=q.id AND user_id=p_user_id;
  ELSIF a.kind='economy' THEN
   SELECT * INTO q FROM public.quests WHERE id=(a.input->>'questId')::uuid AND user_id=p_user_id FOR UPDATE;
   IF q.id IS NULL OR q.status<>'active' THEN RAISE EXCEPTION 'Challenge is no longer active' USING ERRCODE='40001'; END IF;
   UPDATE public.quests SET quest_data=p_quest,difficulty=(p_quest->>'difficulty')::int WHERE id=q.id AND user_id=p_user_id;
  ELSIF a.kind='profession' AND p_profile->>'profession' IS DISTINCT FROM old.profession THEN
   INSERT INTO public.profession_evolutions(user_id,from_profession,to_profession,trigger_type) VALUES(p_user_id,old.profession,p_profile->>'profession','leaderboard');
  END IF;
  saved_profile:=public.apply_journey_profile(p_user_id,p_revision,p_profile);
 END IF;
 IF p_mission IS NOT NULL AND saved_profile IS NOT NULL THEN
  INSERT INTO public.journey_mission_state(user_id,state) VALUES(p_user_id,p_mission) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,updated_at=clock_timestamp();
 END IF;
 answer:=coalesce(p_extra,'{}'::jsonb)||jsonb_build_object('profile',saved_profile,'quest',p_quest);
 UPDATE public.journey_actions SET result=answer,lease_id=NULL,expires_at=NULL WHERE user_id=p_user_id AND action_key=p_key;
 RETURN answer;
END $$;
CREATE FUNCTION public.pending_journey_outcome(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('questId',quest_id,'result',result,'gradeSeen',revealed_at IS NOT NULL,'eventCursor',event_cursor)
 FROM public.quest_outcomes WHERE user_id=p_user_id AND (revealed_at IS NULL OR event_cursor<jsonb_array_length(result->'events')) ORDER BY created_at,quest_id LIMIT 1;
$$;
-- Auth membership is read only through this narrow, non-exposed helper. Do not
-- grant general SELECT on auth.users to the application database role.
CREATE SCHEMA IF NOT EXISTS zynth_private;
REVOKE ALL ON SCHEMA zynth_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA zynth_private TO service_role;
CREATE FUNCTION zynth_private.profession_rank(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH ranked AS (
 SELECT p.user_id,row_number() OVER(ORDER BY p.cumulative_exp DESC,p.created_at,p.user_id) AS rank
 FROM public.profiles p JOIN auth.users u ON u.id=p.user_id
 WHERE p.domain=(SELECT domain FROM public.profiles WHERE user_id=p_user_id) AND u.confirmed_at IS NOT NULL AND p.leaderboard_opt_out IS NOT TRUE
 ) SELECT jsonb_build_object('rank',CASE WHEN EXISTS(SELECT 1 FROM public.quest_outcomes WHERE user_id=p_user_id AND provenance='server') THEN coalesce((SELECT rank FROM ranked WHERE user_id=p_user_id),0) ELSE 0 END,'total',(SELECT count(*) FROM ranked));
$$;
REVOKE ALL ON FUNCTION zynth_private.profession_rank(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION zynth_private.profession_rank(uuid) TO service_role;
CREATE FUNCTION public.trusted_profession_rank(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT zynth_private.profession_rank(p_user_id) $$;
REVOKE ALL ON FUNCTION public.pending_journey_outcome(uuid),public.trusted_profession_rank(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pending_journey_outcome(uuid),public.trusted_profession_rank(uuid) TO service_role;
CREATE FUNCTION public.verified_mission_credits(p_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT greatest(0,coalesce(sum(CASE WHEN q.quest_type='mission' THEN -7 ELSE 1 END),0))::integer
 FROM public.quest_outcomes o JOIN public.quests q ON q.id=o.quest_id AND q.user_id=o.user_id
 WHERE o.user_id=p_user_id AND o.provenance='server' AND o.result->'gradeResult'->>'grade' IN ('Basic','Good','Excellent')
 AND q.quest_type IN ('calibration','daily','challenge','hidden','weakness','prestige','mission')
 AND NOT coalesce(q.swift_mode_used,false) AND coalesce(q.retest_count,0)=0;
$$;
REVOKE ALL ON FUNCTION public.verified_mission_credits(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verified_mission_credits(uuid) TO service_role;

-- Extend the previously tested atomic result, preserving its public signature.
ALTER FUNCTION public.commit_quest_result(uuid,uuid,bigint,jsonb,jsonb) RENAME TO commit_quest_result_foundation;
CREATE FUNCTION public.commit_quest_result(p_user_id uuid,p_quest_id uuid,p_expected_revision bigint,p_profile jsonb,p_result jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE answer jsonb; old public.profiles; evidence text; BEGIN
 SELECT * INTO old FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 INSERT INTO public.journey_legacy_snapshots(user_id,source,snapshot) VALUES(p_user_id,'cloud_baseline',to_jsonb(old)) ON CONFLICT DO NOTHING;
 answer:=public.commit_quest_result_foundation(p_user_id,p_quest_id,p_expected_revision,p_profile,p_result);
 IF NOT (answer->>'replayed')::boolean THEN
  SELECT coalesce(plan->>'provenance','legacy') INTO evidence FROM public.journey_actions WHERE user_id=p_user_id AND kind='generate' AND result->'quest'->>'id'=p_quest_id::text LIMIT 1;
  evidence:=coalesce(evidence,'legacy');
  UPDATE public.quest_outcomes SET provenance=evidence WHERE user_id=p_user_id AND quest_id=p_quest_id;
  INSERT INTO public.progression_events(user_id,source_quest_id,event_index,kind,payload)
  VALUES(p_user_id,p_quest_id,jsonb_array_length(p_result->'events'),CASE WHEN (SELECT quest_type FROM public.quests WHERE id=p_quest_id)='mission' THEN 'mission_completed' ELSE 'quest_completed' END,
   jsonb_build_object('source_quest_id',p_quest_id,'grade',p_result->'gradeResult'->>'grade','provenance',evidence,'policyVersion',1));
  IF p_result->'missionState' IS NOT NULL THEN
   INSERT INTO public.journey_mission_state(user_id,state) VALUES(p_user_id,p_result->'missionState') ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,updated_at=clock_timestamp();
  END IF;
 END IF;
 RETURN answer;
END $$;
CREATE FUNCTION public.ack_journey_outcome(p_user_id uuid,p_quest_id uuid,p_grade boolean,p_cursor integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o public.quest_outcomes; BEGIN
 SELECT * INTO o FROM public.quest_outcomes WHERE user_id=p_user_id AND quest_id=p_quest_id FOR UPDATE;
 IF NOT FOUND OR p_cursor<0 OR p_cursor>jsonb_array_length(o.result->'events') OR p_cursor>o.event_cursor+1 THEN RAISE EXCEPTION 'Invalid outcome acknowledgement' USING ERRCODE='22023'; END IF;
 UPDATE public.quest_outcomes SET revealed_at=CASE WHEN p_grade THEN coalesce(revealed_at,clock_timestamp()) ELSE revealed_at END,event_cursor=greatest(event_cursor,p_cursor) WHERE user_id=p_user_id AND quest_id=p_quest_id;
END $$;

CREATE FUNCTION public.record_journey_rejection(p_user_id uuid,p_quest_id uuid,p_revision bigint,p_flags jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE p public.profiles; BEGIN
 SELECT * INTO p FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR p.progression_revision IS DISTINCT FROM p_revision OR NOT EXISTS(SELECT 1 FROM public.quests WHERE id=p_quest_id AND user_id=p_user_id AND status='active') THEN RAISE EXCEPTION 'Challenge changed' USING ERRCODE='40001'; END IF;
 UPDATE public.profiles SET exploit_flags=p_flags WHERE user_id=p_user_id;
END $$;
REVOKE ALL ON FUNCTION public.record_journey_rejection(uuid,uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_journey_rejection(uuid,uuid,bigint,jsonb) TO service_role;

-- Prepare reset compatibility; invoked only by the owner's existing reset UI.
CREATE FUNCTION public.reset_journey(p_user_id uuid,p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 INSERT INTO public.journey_reset_receipts(user_id,request_id) VALUES(p_user_id,p_request_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 PERFORM 1 FROM public.profiles WHERE user_id=p_user_id FOR UPDATE;
 DELETE FROM public.journey_mission_state WHERE user_id=p_user_id;
 DELETE FROM public.quest_submission_leases WHERE user_id=p_user_id;
 DELETE FROM public.progression_events WHERE user_id=p_user_id;
 DELETE FROM public.quest_outcomes WHERE user_id=p_user_id;
 DELETE FROM public.journey_actions WHERE user_id=p_user_id;
 DELETE FROM public.journey_legacy_snapshots WHERE user_id=p_user_id;
 DELETE FROM public.quests WHERE user_id=p_user_id;
 DELETE FROM public.onboarding_drafts WHERE user_id=p_user_id;
 DELETE FROM public.profiles WHERE user_id=p_user_id;
END $$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure signature FROM pg_catalog.pg_proc WHERE pronamespace='public'::regnamespace AND proname IN
 ('consume_journey_budget','claim_journey_action','release_journey_action','apply_journey_profile','commit_journey_action','commit_quest_result','ack_journey_outcome','reset_journey') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
