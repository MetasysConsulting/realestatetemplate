-- Admin members list (profiles + auth metadata) via SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION public.get_admin_members()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'total', 0,
      'members', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'total', (SELECT COUNT(*)::int FROM profiles),
    'members', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id::text,
        'email', coalesce(p.email, u.email, ''),
        'fullName', coalesce(nullif(btrim(p.full_name), ''), split_part(coalesce(p.email, u.email, ''), '@', 1), 'Member'),
        'phone', p.phone,
        'createdAt', to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'updatedAt', to_char(p.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'lastSignInAt', CASE
          WHEN u.last_sign_in_at IS NULL THEN NULL
          ELSE to_char(u.last_sign_in_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        END,
        'emailConfirmed', u.email_confirmed_at IS NOT NULL,
        'unlockIntents', coalesce((
          SELECT COUNT(*)::int
          FROM site_analytics_events e
          WHERE e.user_id = p.id
            AND e.event_name = 'unlock_intent'
        ), 0),
        'pageViews', coalesce((
          SELECT COUNT(*)::int
          FROM site_analytics_events e
          WHERE e.user_id = p.id
            AND e.event_name = 'page_view'
        ), 0)
      ) ORDER BY p.created_at DESC)
      FROM profiles p
      LEFT JOIN auth.users u ON u.id = p.id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_members() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_members() TO anon, authenticated, service_role;
