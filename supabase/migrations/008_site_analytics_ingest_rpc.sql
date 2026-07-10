-- Allow analytics ingest + admin summary via RPC when direct DB/service
-- credentials are unavailable (Vercel with public Supabase keys only).

CREATE OR REPLACE FUNCTION public.ingest_site_analytics_events(payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  inserted integer := 0;
  event_name text;
  event_path text;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    event_name := coalesce(item->>'event_name', '');
    IF event_name NOT IN (
      'page_view',
      'login_success',
      'signup_success',
      'logout',
      'unlock_intent'
    ) THEN
      CONTINUE;
    END IF;

    event_path := coalesce(nullif(btrim(item->>'path'), ''), '/');
    IF char_length(event_path) > 500 THEN
      event_path := left(event_path, 500);
    END IF;

    INSERT INTO site_analytics_events (
      event_name,
      path,
      referrer,
      session_id,
      visitor_id,
      user_id,
      metadata,
      user_agent
    ) VALUES (
      event_name,
      event_path,
      NULLIF(left(coalesce(item->>'referrer', ''), 500), ''),
      left(coalesce(item->>'session_id', ''), 128),
      left(coalesce(item->>'visitor_id', ''), 128),
      CASE
        WHEN coalesce(item->>'user_id', '') ~* '^[0-9a-f-]{36}$'
          THEN (item->>'user_id')::uuid
        ELSE NULL
      END,
      CASE
        WHEN jsonb_typeof(item->'metadata') = 'object' THEN item->'metadata'
        ELSE '{}'::jsonb
      END,
      NULLIF(left(coalesce(item->>'user_agent', ''), 500), '')
    );

    inserted := inserted + 1;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_site_analytics_events(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_site_analytics_events(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_site_activity_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF to_regclass('public.site_analytics_events') IS NULL THEN
    RETURN jsonb_build_object('available', false);
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'visitorsToday', (
      SELECT COUNT(DISTINCT visitor_id)::int
      FROM site_analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= date_trunc('day', NOW())
        AND visitor_id <> ''
    ),
    'visitors7d', (
      SELECT COUNT(DISTINCT visitor_id)::int
      FROM site_analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= NOW() - INTERVAL '7 days'
        AND visitor_id <> ''
    ),
    'pageViewsToday', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= date_trunc('day', NOW())
    ),
    'pageViews7d', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'sessions7d', (
      SELECT COUNT(DISTINCT session_id)::int
      FROM site_analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= NOW() - INTERVAL '7 days'
        AND session_id <> ''
    ),
    'loginEvents7d', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'login_success'
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'signupEvents7d', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'signup_success'
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'logoutEvents7d', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'logout'
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'unlockIntents7d', (
      SELECT COUNT(*)::int
      FROM site_analytics_events
      WHERE event_name = 'unlock_intent'
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'topPages', coalesce((
      SELECT jsonb_agg(jsonb_build_object('path', path, 'views', views) ORDER BY views DESC, path ASC)
      FROM (
        SELECT path, COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY path
        ORDER BY views DESC, path ASC
        LIMIT 10
      ) t
    ), '[]'::jsonb),
    'trafficBySection', coalesce((
      SELECT jsonb_agg(jsonb_build_object('section', section, 'views', views) ORDER BY views DESC, section ASC)
      FROM (
        SELECT
          CASE
            WHEN split_part(path, '?', 1) IN ('/', '') THEN 'Home'
            WHEN split_part(path, '?', 1) ILIKE '/buy%' THEN 'Buy'
            WHEN split_part(path, '?', 1) ILIKE '/auctions%'
              OR split_part(path, '?', 1) ILIKE '/property%' THEN 'Auctions & listings'
            WHEN split_part(path, '?', 1) ILIKE '/search%' THEN 'Search'
            WHEN split_part(path, '?', 1) ILIKE '/learn%' THEN 'Learn'
            WHEN split_part(path, '?', 1) ILIKE '/sell%' THEN 'Sell'
            WHEN split_part(path, '?', 1) ILIKE '/loans%' THEN 'Loans'
            WHEN split_part(path, '?', 1) ILIKE '/my-profile%'
              OR split_part(path, '?', 1) ILIKE '/auth%' THEN 'Account'
            ELSE 'Other'
          END AS section,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC, section ASC
      ) s
    ), '[]'::jsonb),
    'dailyTrend', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'date', day,
        'pageViews', page_views,
        'visitors', visitors
      ) ORDER BY day ASC)
      FROM (
        SELECT
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
          COUNT(DISTINCT visitor_id) FILTER (
            WHERE event_name = 'page_view' AND visitor_id <> ''
          )::int AS visitors
        FROM site_analytics_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY 1 ASC
      ) d
    ), '[]'::jsonb),
    'topReferrers', coalesce((
      SELECT jsonb_agg(jsonb_build_object('referrer', referrer, 'views', views) ORDER BY views DESC, referrer ASC)
      FROM (
        SELECT
          CASE
            WHEN referrer IS NULL OR btrim(referrer) = '' THEN '(direct)'
            ELSE left(referrer, 120)
          END AS referrer,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC, referrer ASC
        LIMIT 8
      ) r
    ), '[]'::jsonb),
    'recentEvents', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id::text,
        'createdAt', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'eventName', event_name,
        'path', path
      ) ORDER BY created_at DESC)
      FROM (
        SELECT id, created_at, event_name, path
        FROM site_analytics_events
        ORDER BY created_at DESC
        LIMIT 25
      ) e
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_site_activity_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_activity_summary() TO anon, authenticated, service_role;
