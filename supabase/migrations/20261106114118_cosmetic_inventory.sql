-- Cosmetic ownership is separate from editable appearance and progression resets.
CREATE TABLE public.cosmetic_catalog (
 id text PRIMARY KEY, version integer NOT NULL CHECK(version=1),
 slot text NOT NULL CHECK(slot IN ('outfit','accessory','aura')),
 name text NOT NULL, description text NOT NULL, rarity text NOT NULL,
 requirement text NOT NULL, rule text NOT NULL,
 UNIQUE(id,slot)
);
INSERT INTO public.cosmetic_catalog VALUES
 ('wayfarer-coat',1,'outfit','Wayfarer coat','A familiar layer for a new direction.','Common','Free starter outfit','starter'),
 ('studio-knit',1,'outfit','Studio knit','Made for quiet work and fresh ideas.','Common','Free starter outfit','starter'),
 ('field-jacket',1,'outfit','Field jacket','Ready to take your learning into the world.','Common','Free starter outfit','starter'),
 ('trail-scarf',1,'accessory','Trail scarf','A small reminder of your first deliberate step.','Common','Complete a learning quest with Basic or better','lesson'),
 ('mission-satchel',1,'accessory','Mission satchel','Carry what you have learned into practice.','Uncommon','Complete a mission with Basic or better','mission'),
 ('scholar-coat',1,'outfit','Scholar coat','A gold-trimmed coat for your growing craft.','Rare','Reach level 5 through verified progression','level5'),
 ('sharp-pin',1,'accessory','Sharp pin','A bright mark of a well-considered solution.','Rare','Earn the Sharp achievement','sharp'),
 ('focus-halo',1,'aura','Focus halo','A quiet orbit around a determined mind.','Rare','Reach level 10 through verified progression','level10');

-- Each row is both the ownership record and its immutable grant receipt.
-- auth.users rather than profiles keeps inventory independent of prestige/reset.
CREATE TABLE public.cosmetic_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 item_id text NOT NULL REFERENCES public.cosmetic_catalog(id),
 source_kind text NOT NULL CHECK(source_kind IN ('starter','quest','event')),
 source_id uuid NOT NULL, awarded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,item_id)
);
CREATE INDEX cosmetic_grants_item ON public.cosmetic_grants(item_id);
CREATE TABLE public.cosmetic_equipment (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 slot text NOT NULL CHECK(slot IN ('outfit','accessory','aura')),
 item_id text NOT NULL,
 PRIMARY KEY(user_id,slot),
 FOREIGN KEY(user_id,item_id) REFERENCES public.cosmetic_grants(user_id,item_id),
 FOREIGN KEY(item_id,slot) REFERENCES public.cosmetic_catalog(id,slot)
);
CREATE INDEX cosmetic_equipment_item_slot ON public.cosmetic_equipment(item_id,slot);
ALTER TABLE public.cosmetic_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetic_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetic_equipment ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cosmetic_catalog,public.cosmetic_grants,public.cosmetic_equipment FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.cosmetic_catalog,public.cosmetic_grants,public.cosmetic_equipment TO authenticated,service_role;
GRANT INSERT ON public.cosmetic_grants TO service_role;
GRANT INSERT,UPDATE,DELETE ON public.cosmetic_equipment TO service_role;
CREATE POLICY read_cosmetic_catalog ON public.cosmetic_catalog FOR SELECT TO authenticated USING(true);
CREATE POLICY own_cosmetic_grants ON public.cosmetic_grants FOR SELECT TO authenticated USING((select auth.uid())=user_id);
CREATE POLICY own_cosmetic_equipment ON public.cosmetic_equipment FOR SELECT TO authenticated USING((select auth.uid())=user_id);

-- Reconcile durable, server-provenance evidence on reads and after completion.
-- Retries recover grants without changing quest results or rolling back learning.
CREATE FUNCTION public.sync_cosmetic_inventory(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE snapshot jsonb;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cosmetics:'||p_user_id::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_user_id) THEN
  RAISE EXCEPTION 'Profile required' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.cosmetic_grants(user_id,item_id,source_kind,source_id)
 SELECT p_user_id,id,'starter',p_user_id FROM public.cosmetic_catalog WHERE rule='starter'
 ON CONFLICT(user_id,item_id) DO NOTHING;
 WITH evidence AS (
  SELECT c.id AS item_id,'quest' AS source_kind,o.quest_id AS source_id,o.created_at
  FROM public.quest_outcomes o JOIN public.quests q ON q.id=o.quest_id AND q.user_id=o.user_id
  JOIN public.cosmetic_catalog c ON
   (c.rule='lesson' AND q.quest_type<>'mission' AND jsonb_typeof(q.quest_data->'learning')='object') OR
   (c.rule='mission' AND q.quest_type='mission')
  WHERE o.user_id=p_user_id AND o.provenance='server' AND o.result->'gradeResult'->>'grade' IN ('Basic','Good','Excellent')
  UNION ALL
  SELECT c.id,'event',e.id,e.created_at
  FROM public.progression_events e JOIN public.quest_outcomes o ON o.user_id=e.user_id AND o.quest_id=e.source_quest_id
  JOIN public.cosmetic_catalog c ON
   (c.rule='level5' AND e.kind='level_up' AND e.payload->'to'>='5'::jsonb AND jsonb_typeof(e.payload->'to')='number') OR
   (c.rule='level10' AND e.kind='level_up' AND e.payload->'to'>='10'::jsonb AND jsonb_typeof(e.payload->'to')='number') OR
   (c.rule='sharp' AND e.kind='achievement' AND e.payload->>'id'='first_excellent')
  WHERE e.user_id=p_user_id AND o.provenance='server'
 ), first_source AS (
  SELECT DISTINCT ON(item_id) item_id,source_kind,source_id FROM evidence ORDER BY item_id,created_at,source_id
 ) INSERT INTO public.cosmetic_grants(user_id,item_id,source_kind,source_id)
 SELECT p_user_id,item_id,source_kind,source_id FROM first_source ON CONFLICT(user_id,item_id) DO NOTHING;

 SELECT jsonb_build_object('version',1,'owner',p_user_id,
  'items',(SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('owned',g.id IS NOT NULL,'equipped',eq.item_id IS NOT NULL,'awardedAt',g.awarded_at) ORDER BY c.slot,c.id)
   FROM public.cosmetic_catalog c LEFT JOIN public.cosmetic_grants g ON g.item_id=c.id AND g.user_id=p_user_id
   LEFT JOIN public.cosmetic_equipment eq ON eq.user_id=p_user_id AND eq.item_id=c.id),
  'equipment',coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.cosmetic_equipment WHERE user_id=p_user_id),'{}'::jsonb)) INTO snapshot;
 RETURN snapshot;
END;
$$;
CREATE FUNCTION public.equip_cosmetic(p_user_id uuid,p_slot text,p_item_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 PERFORM public.sync_cosmetic_inventory(p_user_id);
 IF p_slot NOT IN ('outfit','accessory','aura') OR p_slot IS NULL THEN
  RAISE EXCEPTION 'Invalid equipment slot' USING ERRCODE='22023';
 END IF;
 IF p_item_id IS NULL THEN
  DELETE FROM public.cosmetic_equipment WHERE user_id=p_user_id AND slot=p_slot;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM public.cosmetic_catalog c JOIN public.cosmetic_grants g ON g.item_id=c.id
   WHERE g.user_id=p_user_id AND c.id=p_item_id AND c.slot=p_slot) THEN
   RAISE EXCEPTION 'Item is not owned or does not fit this slot' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.cosmetic_equipment(user_id,slot,item_id) VALUES(p_user_id,p_slot,p_item_id)
  ON CONFLICT(user_id,slot) DO UPDATE SET item_id=excluded.item_id;
 END IF;
 RETURN public.sync_cosmetic_inventory(p_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.sync_cosmetic_inventory(uuid),public.equip_cosmetic(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_cosmetic_inventory(uuid),public.equip_cosmetic(uuid,text,text) TO service_role;
