-- Activity summary: service_role OR allowlisted authenticated admins.
-- Keep anon locked out. Members RPC stays service_role-only.

CREATE OR REPLACE FUNCTION public.get_site_activity_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  caller_email text;
  is_admin boolean := false;
BEGIN
  -- service_role (server secret) always allowed
  IF auth.role() = 'service_role' THEN
    is_admin := true;
  ELSE
    caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
    is_admin := caller_email IN (
      'creditteck1@gmail.com',
      'metasysprojects@gmail.com'
    );
  END IF;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'not authorized'
      USING ERRCODE = '42501';
  END IF;

  IF to_regclass('public.site_analytics_events') IS NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'visitorsToday', 0,
      'visitors7d', 0,
      'pageViewsToday', 0,
      'pageViews7d', 0,
      'sessions7d', 0,
      'loginEvents7d', 0,
      'signupEvents7d', 0,
      'logoutEvents7d', 0,
      'unlockIntents7d', 0,
      'topPages', '[]'::jsonb,
      'trafficBySection', '[]'::jsonb,
      'dailyTrend', '[]'::jsonb,
      'topReferrers', '[]'::jsonb,
      'recentEvents', '[]'::jsonb
    );
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
      SELECT jsonb_agg(jsonb_build_object('path', path, 'views', views) ORDER BY views DESC)
      FROM (
        SELECT path, COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY path
        ORDER BY views DESC
        LIMIT 8
      ) t
    ), '[]'::jsonb),
    'trafficBySection', coalesce((
      SELECT jsonb_agg(jsonb_build_object('section', section, 'views', views) ORDER BY views DESC)
      FROM (
        SELECT
          CASE
            WHEN path = '/' OR path = '' THEN 'Home'
            WHEN path ILIKE '/buy%' THEN 'Buy'
            WHEN path ILIKE '/auctions%' OR path ILIKE '/property%' THEN 'Auctions & listings'
            WHEN path ILIKE '/search%' THEN 'Search'
            WHEN path ILIKE '/learn%' THEN 'Learn'
            WHEN path ILIKE '/sell%' THEN 'Sell'
            WHEN path ILIKE '/loans%' THEN 'Loans'
            WHEN path ILIKE '/my-profile%' OR path ILIKE '/auth%' THEN 'Account'
            ELSE 'Other'
          END AS section,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC
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
      SELECT jsonb_agg(jsonb_build_object('referrer', referrer, 'views', views) ORDER BY views DESC)
      FROM (
        SELECT
          CASE
            WHEN referrer IS NULL OR btrim(referrer) = '' THEN '(direct)'
            ELSE left(btrim(referrer), 120)
          END AS referrer,
          COUNT(*)::int AS views
        FROM site_analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY views DESC
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
        LIMIT 20
      ) e
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_site_activity_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_site_activity_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_site_activity_summary() TO authenticated, service_role;
