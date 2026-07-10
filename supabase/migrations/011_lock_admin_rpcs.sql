-- Lock sensitive admin RPCs to service_role only.
-- Public ingest stays callable by anon (site analytics beacon).

REVOKE ALL ON FUNCTION public.get_admin_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_members() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_members() TO service_role;

REVOKE ALL ON FUNCTION public.get_site_activity_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_site_activity_summary() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_site_activity_summary() TO service_role;

-- Keep ingest public for the site beacon (validated event names inside the function).
REVOKE ALL ON FUNCTION public.ingest_site_analytics_events(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_site_analytics_events(jsonb) TO anon, authenticated, service_role;
