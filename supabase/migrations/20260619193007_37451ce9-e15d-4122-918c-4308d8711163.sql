
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'cakto_webhook_events','commercial_events','commercial_profiles',
    'emotional_memories','emotional_profiles','funnel_memberships','funnel_steps',
    'lead_memories','leads','objection_detections','objection_types',
    'response_performance','seller_profiles','story_funnel_memberships',
    'story_funnel_metrics','story_funnels','story_steps','voice_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))',
      t || '_admin_all', t
    );
  END LOOP;
END $$;
