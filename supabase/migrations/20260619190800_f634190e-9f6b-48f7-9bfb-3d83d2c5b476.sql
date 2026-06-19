
-- Drop open demo policies and replace with admin-only access
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'seller_profile','funnels','funnel_leads','stories','story_leads',
    'quick_replies','memories','objections','cakto_events','ai_learnings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_all_'||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))',
      'admin_all_'||t, t);
  END LOOP;
END $$;

-- Block privilege escalation on user_roles: only admins can write
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
