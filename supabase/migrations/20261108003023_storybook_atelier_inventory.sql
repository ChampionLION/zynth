-- M3/M4 storybook atelier. Preserve all existing grants and progression.
ALTER TABLE public.cosmetic_catalog DROP CONSTRAINT cosmetic_catalog_slot_check;
ALTER TABLE public.cosmetic_catalog ADD CONSTRAINT cosmetic_catalog_slot_check CHECK(slot IN ('outfit','accessory','aura','headwear','eyes','hands','feet','back','neck'));
ALTER TABLE public.cosmetic_equipment DROP CONSTRAINT cosmetic_equipment_slot_check;
ALTER TABLE public.cosmetic_equipment ADD CONSTRAINT cosmetic_equipment_slot_check CHECK(slot IN ('outfit','accessory','aura','headwear','eyes','hands','feet','back','neck'));
INSERT INTO public.cosmetic_catalog(id,version,slot,name,description,rarity,requirement,rule) VALUES
('linen-layers',1,'outfit','Linen layers','Quietly woven, lightly worn.','Uncommon','Discovered along your journey','lessons:3'),
('cartographer-vest',1,'outfit','Cartographer vest','Leather shaped by the road.','Rare','Discovered along your journey','missions:2'),
('grove-cloak',1,'outfit','Grove cloak','A deep green fold of the woodland.','Rare','Discovered along your journey','missions:3'),
('artisan-apron',1,'outfit','Artisan apron','A place for tools and new ideas.','Uncommon','Discovered along your journey','lessons:5'),
('copper-spectacles',1,'eyes','Copper spectacles','A warmer way to see the details.','Uncommon','Discovered along your journey','lessons:4'),
('field-gloves',1,'hands','Field gloves','Soft knit for a steady hand.','Uncommon','Discovered along your journey','lessons:6'),
('ridge-boots',1,'feet','Ridge boots','A sure footing on unfamiliar ground.','Rare','Discovered along your journey','missions:2'),
('grove-hood',1,'headwear','Grove hood','Shelter beneath a woven canopy.','Rare','Discovered along your journey','lessons:8'),
('leaf-pendant',1,'neck','Leaf pendant','A small leaf with a long memory.','Rare','Discovered along your journey','lessons:10'),
('map-carrier',1,'back','Map carrier','Room for the places still to come.','Rare','Discovered along your journey','missions:4'),
('lantern-charm',1,'accessory','Lantern charm','Carry a little light with you.','Rare','Discovered along your journey','lessons:12'),
('tide-coat',1,'outfit','Tide coat','A layer for the farther shore.','Rare','Discovered along your journey','missions:5')
ON CONFLICT(id) DO NOTHING;
DROP POLICY read_cosmetic_catalog ON public.cosmetic_catalog;
CREATE POLICY read_cosmetic_catalog ON public.cosmetic_catalog FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.cosmetic_grants g WHERE g.item_id=cosmetic_catalog.id AND g.user_id=(select auth.uid())));
CREATE OR REPLACE FUNCTION public.sync_cosmetic_inventory(p_user_id uuid) RETURNS jsonb
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

 WITH lesson_evidence AS (
 SELECT o.quest_id,o.created_at,row_number() OVER(ORDER BY o.created_at,o.quest_id) AS n
 FROM public.quest_outcomes o JOIN public.quests q ON q.id=o.quest_id AND q.user_id=o.user_id
 WHERE o.user_id=p_user_id AND o.provenance='server' AND o.result->'gradeResult'->>'grade' IN ('Basic','Good','Excellent') AND q.quest_type<>'mission' AND jsonb_typeof(q.quest_data->'learning')='object'
 ), mission_evidence AS (
 SELECT o.quest_id,o.created_at,row_number() OVER(ORDER BY o.created_at,o.quest_id) AS n
 FROM public.quest_outcomes o JOIN public.quests q ON q.id=o.quest_id AND q.user_id=o.user_id
 WHERE o.user_id=p_user_id AND o.provenance='server' AND o.result->'gradeResult'->>'grade' IN ('Basic','Good','Excellent') AND q.quest_type='mission'
 ), evidence AS (
 SELECT c.id,l.quest_id FROM public.cosmetic_catalog c JOIN lesson_evidence l ON c.rule='lessons:'||l.n::text
 UNION ALL SELECT c.id,m.quest_id FROM public.cosmetic_catalog c JOIN mission_evidence m ON c.rule='missions:'||m.n::text
 ) INSERT INTO public.cosmetic_grants(user_id,item_id,source_kind,source_id)
 SELECT p_user_id,id,'quest',quest_id FROM evidence ON CONFLICT(user_id,item_id) DO NOTHING;
 SELECT jsonb_build_object('version',1,'owner',p_user_id,
  'items',(SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('owned',g.id IS NOT NULL,'equipped',eq.item_id IS NOT NULL,'awardedAt',g.awarded_at) ORDER BY c.slot,c.id)
   FROM public.cosmetic_catalog c JOIN public.cosmetic_grants g ON g.item_id=c.id AND g.user_id=p_user_id
   LEFT JOIN public.cosmetic_equipment eq ON eq.user_id=p_user_id AND eq.item_id=c.id),
  'equipment',coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.cosmetic_equipment WHERE user_id=p_user_id),'{}'::jsonb)) INTO snapshot;
 RETURN snapshot;
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_cosmetic(p_user_id uuid,p_slot text,p_item_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 PERFORM public.sync_cosmetic_inventory(p_user_id);
 IF p_slot NOT IN ('outfit','accessory','aura','headwear','eyes','hands','feet','back','neck') OR p_slot IS NULL THEN
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

CREATE OR REPLACE FUNCTION public.sanitize_public_avatar(p_avatar jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$ SELECT jsonb_build_object('version',1,
'gender',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'gender' IN ('male','female') THEN p_avatar->>'gender' ELSE 'male' END,
'skin',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'skin' IN ('porcelain','sand','copper','umber','ebony','olive') THEN p_avatar->>'skin' ELSE 'copper' END,
'hair',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'hair' IN ('crop','waves','coils','shaved','bob','long','pixie','undercut','braids','locs','ponytail','bun','twists','afro') THEN p_avatar->>'hair' ELSE 'waves' END,
'hairColor',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'hairColor' IN ('ink','chestnut','silver','auburn','honey') THEN p_avatar->>'hairColor' ELSE 'ink' END,
'outfit',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'outfit' IN ('wayfarer-coat','studio-knit','field-jacket') THEN p_avatar->>'outfit' ELSE 'wayfarer-coat' END,
'palette',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'palette' IN ('moss','ochre','slate','plum','cream','rust') THEN p_avatar->>'palette' ELSE 'moss' END,
'background',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'background' IN ('atrium','grove','workshop') THEN p_avatar->>'background' ELSE 'atrium' END,
'face',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'face' IN ('oval','round','angular','heart') THEN p_avatar->>'face' ELSE 'oval' END,
'build',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'build' IN ('slim','balanced','sturdy') THEN p_avatar->>'build' ELSE 'balanced' END,
'stature',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'stature' IN ('short','average','tall') THEN p_avatar->>'stature' ELSE 'average' END,
'eyes',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'eyes' IN ('brown','hazel','green','blue','grey') THEN p_avatar->>'eyes' ELSE 'brown' END,
'beard',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'beard' IN ('clean','stubble','trimmed','full') THEN p_avatar->>'beard' ELSE 'clean' END,
'expression',CASE WHEN p_avatar->'version'='1'::jsonb AND p_avatar->>'expression' IN ('gentle','bright','thoughtful') THEN p_avatar->>'expression' ELSE 'gentle' END,'accessory',NULL,'aura',NULL) $$;

REVOKE ALL ON FUNCTION public.sanitize_public_avatar(jsonb) FROM PUBLIC,anon,authenticated;
