-- A narrow, read-only projection across opted-in profiles. No private profile
-- SELECT policy is relaxed, and no service credential is needed in the app.
CREATE INDEX IF NOT EXISTS idx_profiles_public_board
  ON public.profiles(cumulative_exp DESC,created_at,user_id)
  WHERE cumulative_exp > 0 AND leaderboard_opt_out IS FALSE;

CREATE OR REPLACE FUNCTION public.get_live_leaderboard(
  p_category text DEFAULT 'all', p_offset integer DEFAULT 0, p_limit integer DEFAULT 25
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  result jsonb;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
  IF p_category IS NULL OR p_category NOT IN ('all','TECHNICAL','CREATIVE','ANALYTICAL','SOCIAL','STRATEGIC')
     OR p_offset IS NULL OR p_offset < 0 OR p_offset > 1000000
     OR p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN
    RAISE EXCEPTION 'Invalid leaderboard filter or page' USING ERRCODE='22023';
  END IF;
  WITH eligible AS MATERIALIZED (
    SELECT p.user_id,p.domain,greatest(1,p.level) AS level,
           p.cumulative_exp AS score,greatest(0,p.streak) AS streak,p.created_at,
           regexp_split_to_array(btrim(coalesce(p.display_name,'')),E'\\s+') AS parts
    FROM public.profiles p
    WHERE p.cumulative_exp > 0 AND p.leaderboard_opt_out IS FALSE
      AND p.domain IN ('TECHNICAL','CREATIVE','ANALYTICAL','SOCIAL','STRATEGIC')
      AND (p_category='all' OR p.domain=p_category)
  ), ranked AS MATERIALIZED (
    SELECT user_id,row_number() OVER(ORDER BY score DESC,created_at ASC NULLS LAST,user_id ASC) AS rank,
      jsonb_build_object(
        'rank',row_number() OVER(ORDER BY score DESC,created_at ASC NULLS LAST,user_id ASC),
        'display_name',coalesce(nullif(parts[1],''),'Wayfarer') || CASE WHEN array_length(parts,1)>1 THEN ' ' || upper(left(parts[array_length(parts,1)],1)) || '.' ELSE '' END,
        'domain',domain,'level',level,'score',score,'streak',streak,'is_user',user_id=caller
      ) AS entry
    FROM eligible
  ), page AS (SELECT entry FROM ranked ORDER BY rank LIMIT p_limit OFFSET p_offset)
  SELECT jsonb_build_object(
    'rows',coalesce((SELECT jsonb_agg(entry) FROM page),'[]'::jsonb),
    'total',(SELECT count(*) FROM ranked),
    'userRank',coalesce((SELECT rank FROM ranked WHERE user_id=caller),0),
    'userRow',(SELECT entry FROM ranked WHERE user_id=caller),
    'participation',CASE
      WHEN (SELECT leaderboard_opt_out FROM public.profiles WHERE user_id=caller) IS TRUE THEN 'opted_out'
      WHEN NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=caller AND cumulative_exp>0) THEN 'no_progress'
      WHEN p_category<>'all' AND (SELECT domain FROM public.profiles WHERE user_id=caller) IS DISTINCT FROM p_category THEN 'other_category'
      ELSE 'ranked' END,
    'updatedAt',statement_timestamp()
  ) INTO result;
  RETURN result;
END;
$$;
-- SECURITY DEFINER is intentional: this exposes only anonymized ranking fields
-- from other owners. auth.uid() is mandatory; caller/user IDs are never inputs.
REVOKE ALL ON FUNCTION public.get_live_leaderboard(text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_live_leaderboard(text,integer,integer) TO authenticated;
COMMENT ON FUNCTION public.get_live_leaderboard(text,integer,integer)
  IS 'Authenticated read-only leaderboard; first name and last initial only, no private profile data, IDs, or rewards.';
