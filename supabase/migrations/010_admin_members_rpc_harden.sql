-- Harden admin members RPC: auth.users as source of truth + safe analytics joins.

CREATE OR REPLACE FUNCTION public.get_admin_members()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  has_analytics boolean;
  has_profiles boolean;
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'total', 0,
      'members', '[]'::jsonb
    );
  END IF;

  has_profiles := to_regclass('public.profiles') IS NOT NULL;
  has_analytics := to_regclass('public.site_analytics_events') IS NOT NULL;

  IF has_profiles AND has_analytics THEN
    SELECT jsonb_build_object(
      'available', true,
      'total', (SELECT COUNT(*)::int FROM auth.users),
      'members', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', u.id::text,
          'email', coalesce(p.email, u.email, ''),
          'fullName', coalesce(
            nullif(btrim(p.full_name), ''),
            split_part(coalesce(p.email, u.email, ''), '@', 1),
            'Member'
          ),
          'phone', p.phone,
          'createdAt', to_char(coalesce(p.created_at, u.created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'updatedAt', to_char(coalesce(p.updated_at, u.updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'lastSignInAt', CASE
            WHEN u.last_sign_in_at IS NULL THEN NULL
            ELSE to_char(u.last_sign_in_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
          END,
          'emailConfirmed', u.email_confirmed_at IS NOT NULL,
          'unlockIntents', coalesce(a.unlock_intents, 0),
          'pageViews', coalesce(a.page_views, 0)
        ) ORDER BY coalesce(p.created_at, u.created_at) DESC)
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        LEFT JOIN (
          SELECT
            e.user_id,
            COUNT(*) FILTER (WHERE e.event_name = 'unlock_intent')::int AS unlock_intents,
            COUNT(*) FILTER (WHERE e.event_name = 'page_view')::int AS page_views
          FROM site_analytics_events e
          WHERE e.user_id IS NOT NULL
          GROUP BY e.user_id
        ) a ON a.user_id = u.id
      ), '[]'::jsonb)
    ) INTO result;
  ELSIF has_profiles THEN
    SELECT jsonb_build_object(
      'available', true,
      'total', (SELECT COUNT(*)::int FROM auth.users),
      'members', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', u.id::text,
          'email', coalesce(p.email, u.email, ''),
          'fullName', coalesce(
            nullif(btrim(p.full_name), ''),
            split_part(coalesce(p.email, u.email, ''), '@', 1),
            'Member'
          ),
          'phone', p.phone,
          'createdAt', to_char(coalesce(p.created_at, u.created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'updatedAt', to_char(coalesce(p.updated_at, u.updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'lastSignInAt', CASE
            WHEN u.last_sign_in_at IS NULL THEN NULL
            ELSE to_char(u.last_sign_in_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
          END,
          'emailConfirmed', u.email_confirmed_at IS NOT NULL,
          'unlockIntents', 0,
          'pageViews', 0
        ) ORDER BY coalesce(p.created_at, u.created_at) DESC)
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
      ), '[]'::jsonb)
    ) INTO result;
  ELSE
    SELECT jsonb_build_object(
      'available', true,
      'total', (SELECT COUNT(*)::int FROM auth.users),
      'members', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', u.id::text,
          'email', coalesce(u.email, ''),
          'fullName', coalesce(
            nullif(btrim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), ''),
            split_part(coalesce(u.email, ''), '@', 1),
            'Member'
          ),
          'phone', NULL,
          'createdAt', to_char(u.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'updatedAt', to_char(u.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'lastSignInAt', CASE
            WHEN u.last_sign_in_at IS NULL THEN NULL
            ELSE to_char(u.last_sign_in_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
          END,
          'emailConfirmed', u.email_confirmed_at IS NOT NULL,
          'unlockIntents', 0,
          'pageViews', 0
        ) ORDER BY u.created_at DESC)
        FROM auth.users u
      ), '[]'::jsonb)
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_members() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_members() TO anon, authenticated, service_role;
