-- Participation and approximate area live in each account's existing metadata.
-- Metadata controls only self-declared board membership, never auth privileges,
-- progression, rewards or access to browsing a ranking list.
CREATE OR REPLACE FUNCTION public.get_leaderboard(
 p_scope text DEFAULT 'global',p_category text DEFAULT 'all',p_offset integer DEFAULT 0,p_limit integer DEFAULT 25,
 p_country text DEFAULT NULL,p_state text DEFAULT NULL,p_city text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 caller uuid:=auth.uid(); own_meta jsonb; own_choice text;
 places jsonb; target jsonb; answer jsonb;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_scope IS NULL OR p_scope NOT IN ('global','national','state','local')
 OR p_category IS NULL OR p_category NOT IN ('all','TECHNICAL','CREATIVE','ANALYTICAL','SOCIAL','STRATEGIC')
 OR p_offset IS NULL OR p_offset<0 OR p_offset>1000000 OR p_limit IS NULL OR p_limit<1 OR p_limit>50
 OR length(coalesce(p_country,''))>80 OR length(coalesce(p_state,''))>80 OR length(coalesce(p_city,''))>80
 THEN RAISE EXCEPTION 'Invalid leaderboard filter or page' USING ERRCODE='22023'; END IF;
 SELECT raw_user_meta_data->'zynth_leaderboard' INTO own_meta FROM auth.users WHERE id=caller;
 own_choice:=CASE WHEN own_meta->>'version'='1' THEN own_meta->>'choice' ELSE NULL END;
 WITH locations AS (
 SELECT DISTINCT
 lower(regexp_replace(btrim(u.raw_user_meta_data#>>'{zynth_leaderboard,location,country}'),E'\\s+',' ','g')) AS country,
 lower(regexp_replace(btrim(u.raw_user_meta_data#>>'{zynth_leaderboard,location,state}'),E'\\s+',' ','g')) AS state,
 lower(regexp_replace(btrim(u.raw_user_meta_data#>>'{zynth_leaderboard,location,city}'),E'\\s+',' ','g')) AS city
 FROM public.profiles p JOIN auth.users u ON u.id=p.user_id
 WHERE p.cumulative_exp>0 AND p.leaderboard_opt_out IS FALSE
 AND u.raw_user_meta_data#>>'{zynth_leaderboard,version}'='1'
 AND u.raw_user_meta_data#>>'{zynth_leaderboard,choice}'='regional'
 ) SELECT coalesce(jsonb_agg(to_jsonb(locations)),'[]'::jsonb) INTO places FROM
 (SELECT * FROM locations WHERE length(country) BETWEEN 1 AND 80 AND length(state) BETWEEN 1 AND 80 AND length(city) BETWEEN 1 AND 80 ORDER BY country,state,city LIMIT 250) locations;
 IF p_country IS NOT NULL OR p_state IS NOT NULL OR p_city IS NOT NULL THEN
  target:=jsonb_build_object('country',coalesce(p_country,''),'state',coalesce(p_state,''),'city',coalesce(p_city,''));
 ELSIF own_choice='regional' THEN target:=own_meta->'location';
 ELSE target:=coalesce(places->0,'{}'::jsonb); END IF;
 target:=jsonb_build_object(
 'country',lower(regexp_replace(btrim(coalesce(target->>'country','')),E'\\s+',' ','g')),
 'state',lower(regexp_replace(btrim(coalesce(target->>'state','')),E'\\s+',' ','g')),
 'city',lower(regexp_replace(btrim(coalesce(target->>'city','')),E'\\s+',' ','g')));
 WITH members AS MATERIALIZED (
 SELECT p.user_id,p.domain,greatest(1,p.level) AS level,p.cumulative_exp AS score,greatest(0,p.streak) AS streak,p.created_at,
 regexp_split_to_array(btrim(coalesce(p.display_name,'')),E'\\s+') AS parts,
 u.raw_user_meta_data#>>'{zynth_leaderboard,choice}' AS choice,
 lower(regexp_replace(btrim(coalesce(u.raw_user_meta_data#>>'{zynth_leaderboard,location,country}','')),E'\\s+',' ','g')) AS country,
 lower(regexp_replace(btrim(coalesce(u.raw_user_meta_data#>>'{zynth_leaderboard,location,state}','')),E'\\s+',' ','g')) AS state,
 lower(regexp_replace(btrim(coalesce(u.raw_user_meta_data#>>'{zynth_leaderboard,location,city}','')),E'\\s+',' ','g')) AS city
 FROM public.profiles p JOIN auth.users u ON u.id=p.user_id
 WHERE p.cumulative_exp>0 AND p.leaderboard_opt_out IS FALSE
 AND u.raw_user_meta_data#>>'{zynth_leaderboard,version}'='1'
 AND u.raw_user_meta_data#>>'{zynth_leaderboard,choice}' IN ('global','regional')
 AND p.domain IN ('TECHNICAL','CREATIVE','ANALYTICAL','SOCIAL','STRATEGIC')
 AND (p_category='all' OR p.domain=p_category)
 ), eligible AS (
 SELECT * FROM members WHERE p_scope='global' OR
 (choice='regional' AND length(country) BETWEEN 1 AND 80 AND length(state) BETWEEN 1 AND 80 AND length(city) BETWEEN 1 AND 80
 AND country=target->>'country' AND (p_scope='national' OR state=target->>'state') AND (p_scope<>'local' OR city=target->>'city'))
 ), ranked AS MATERIALIZED (
 SELECT user_id,row_number() OVER(ORDER BY score DESC,created_at ASC NULLS LAST,user_id ASC) AS rank,
 jsonb_build_object('rank',row_number() OVER(ORDER BY score DESC,created_at ASC NULLS LAST,user_id ASC),
 'display_name',coalesce(nullif(parts[1],''),'Wayfarer')||CASE WHEN array_length(parts,1)>1 THEN ' '||upper(left(parts[array_length(parts,1)],1))||'.' ELSE '' END,
 'domain',domain,'level',level,'score',score,'streak',streak,'is_user',user_id=caller) AS entry FROM eligible
 ), page AS (SELECT entry FROM ranked ORDER BY rank LIMIT p_limit OFFSET p_offset)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(entry) FROM page),'[]'::jsonb),'total',(SELECT count(*) FROM ranked),
 'userRank',coalesce((SELECT rank FROM ranked WHERE user_id=caller),0),'userRow',(SELECT entry FROM ranked WHERE user_id=caller),
 'participation',CASE
 WHEN own_choice IS NULL OR own_choice NOT IN ('global','regional') THEN 'not_joined'
 WHEN (SELECT leaderboard_opt_out FROM public.profiles WHERE user_id=caller) IS TRUE THEN 'opted_out'
 WHEN p_scope<>'global' AND own_choice='global' THEN 'global_only'
 WHEN NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=caller AND cumulative_exp>0) THEN 'no_progress'
 WHEN p_category<>'all' AND (SELECT domain FROM public.profiles WHERE user_id=caller) IS DISTINCT FROM p_category THEN 'other_category'
 WHEN NOT EXISTS(SELECT 1 FROM ranked WHERE user_id=caller) THEN 'outside_region'
 ELSE 'ranked' END,'updatedAt',statement_timestamp(),'region',target,'regions',places) INTO answer;
 RETURN answer;
END;
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard(text,text,integer,integer,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text,text,integer,integer,text,text,text) TO authenticated;
COMMENT ON FUNCTION public.get_leaderboard(text,text,integer,integer,text,text,text)
 IS 'Authenticated anonymous ranking projection; opt-in participation, optional self-declared coarse region, unrestricted board browsing, no rewards.';

-- Keep the former global RPC compatible while enforcing the same consent rules.
CREATE OR REPLACE FUNCTION public.get_live_leaderboard(p_category text DEFAULT 'all',p_offset integer DEFAULT 0,p_limit integer DEFAULT 25)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$ SELECT public.get_leaderboard('global',p_category,p_offset,p_limit,NULL,NULL,NULL)-'region'-'regions' $$;
REVOKE ALL ON FUNCTION public.get_live_leaderboard(text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_live_leaderboard(text,integer,integer) TO authenticated;
