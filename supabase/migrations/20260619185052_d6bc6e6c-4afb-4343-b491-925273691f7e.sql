
-- =============================================================
-- v3: Atualização completa — Cakto + Telegram + Grok opcional
-- =============================================================

-- ---------- seller_profiles ----------
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  avatar_url text,
  short_bio text,
  public_description text,
  communication_style text,
  tone_of_voice text,
  informality_level integer NOT NULL DEFAULT 5,
  use_slang boolean NOT NULL DEFAULT true,
  use_short_messages boolean NOT NULL DEFAULT true,
  use_message_splitting boolean NOT NULL DEFAULT true,
  use_typing_delays boolean NOT NULL DEFAULT true,
  allow_small_typos boolean NOT NULL DEFAULT false,
  typo_frequency integer NOT NULL DEFAULT 0,
  working_hours_enabled boolean NOT NULL DEFAULT false,
  working_hours jsonb,
  away_message text,
  return_message text,
  commercial_rules text,
  emotional_rules text,
  forbidden_promises text,
  default_language text NOT NULL DEFAULT 'pt-BR',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_profiles TO authenticated;
GRANT ALL ON public.seller_profiles TO service_role;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_profiles_all" ON public.seller_profiles;
CREATE POLICY "seller_profiles_all" ON public.seller_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS seller_profiles_updated ON public.seller_profiles;
CREATE TRIGGER seller_profiles_updated BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- cria perfil padrão se nenhum existir
INSERT INTO public.seller_profiles (display_name, short_bio, communication_style, tone_of_voice)
SELECT 'Vendedor Padrão', 'Perfil padrão criado automaticamente.', 'amigável e direto', 'casual'
WHERE NOT EXISTS (SELECT 1 FROM public.seller_profiles);

-- ---------- adicionar seller_profile_id às tabelas principais ----------
DO $$
DECLARE
  t text;
  default_id uuid;
BEGIN
  SELECT id INTO default_id FROM public.seller_profiles ORDER BY created_at LIMIT 1;
  FOREACH t IN ARRAY ARRAY[
    'telegram_users','telegram_groups','plans','contents','orders','payments',
    'access_grants','conversations','messages','quick_replies','automation_rules',
    'funnels','ai_settings','ai_learnings','cakto_events','knowledge_base',
    'activity_logs','memories','objections','stories'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL', t);
    EXECUTE format('UPDATE public.%I SET seller_profile_id = %L WHERE seller_profile_id IS NULL', t, default_id);
  END LOOP;
END $$;

-- ---------- leads (1:1 com telegram_users, extras comerciais) ----------
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  telegram_user_id uuid UNIQUE REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  display_name text,
  username text,
  source text NOT NULL DEFAULT 'telegram',
  source_detail text,
  status text NOT NULL DEFAULT 'new',
  lead_stage text NOT NULL DEFAULT 'new',
  temperature text NOT NULL DEFAULT 'cold' CHECK (temperature IN ('cold','warm','hot')),
  purchase_intent_score integer NOT NULL DEFAULT 0,
  trust_score integer NOT NULL DEFAULT 0,
  relationship_score integer NOT NULL DEFAULT 0,
  emotional_connection_score integer NOT NULL DEFAULT 0,
  commercial_opportunity_score integer NOT NULL DEFAULT 0,
  current_interest text,
  current_offer_id uuid,
  current_funnel_id uuid,
  current_story_funnel_id uuid,
  next_best_action text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  last_interaction_at timestamptz,
  last_purchase_at timestamptz,
  total_spent_cents integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_paid_orders integer NOT NULL DEFAULT 0,
  checkout_abandon_count integer NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_all" ON public.leads;
CREATE POLICY "leads_all" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS leads_updated ON public.leads;
CREATE TRIGGER leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- funnel_steps ----------
CREATE TABLE IF NOT EXISTS public.funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  funnel_id uuid REFERENCES public.funnels(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  name text,
  delay_minutes integer NOT NULL DEFAULT 0,
  message_template text,
  action_type text,
  offer_type text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  requires_human_approval boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_steps TO authenticated;
GRANT ALL ON public.funnel_steps TO service_role;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funnel_steps_all" ON public.funnel_steps;
CREATE POLICY "funnel_steps_all" ON public.funnel_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS funnel_steps_updated ON public.funnel_steps;
CREATE TRIGGER funnel_steps_updated BEFORE UPDATE ON public.funnel_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- funnel_memberships ----------
CREATE TABLE IF NOT EXISTS public.funnel_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  funnel_id uuid REFERENCES public.funnels(id) ON DELETE CASCADE,
  current_step_id uuid REFERENCES public.funnel_steps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  entered_at timestamptz NOT NULL DEFAULT now(),
  last_step_sent_at timestamptz,
  completed_at timestamptz,
  exited_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_memberships TO authenticated;
GRANT ALL ON public.funnel_memberships TO service_role;
ALTER TABLE public.funnel_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funnel_memberships_all" ON public.funnel_memberships;
CREATE POLICY "funnel_memberships_all" ON public.funnel_memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- story_funnels ----------
CREATE TABLE IF NOT EXISTS public.story_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  story_category text NOT NULL,
  main_story_angle text,
  emotional_angle text,
  commercial_goal text,
  primary_offer_type text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  upsell_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  upsell_content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  grok_mode text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_funnels TO authenticated;
GRANT ALL ON public.story_funnels TO service_role;
ALTER TABLE public.story_funnels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_funnels_all" ON public.story_funnels;
CREATE POLICY "story_funnels_all" ON public.story_funnels FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS story_funnels_updated ON public.story_funnels;
CREATE TRIGGER story_funnels_updated BEFORE UPDATE ON public.story_funnels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- story_steps ----------
CREATE TABLE IF NOT EXISTS public.story_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  story_funnel_id uuid REFERENCES public.story_funnels(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_name text,
  step_purpose text,
  message_template text,
  expected_lead_reaction text,
  offer_moment boolean NOT NULL DEFAULT false,
  offer_type text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  requires_response boolean NOT NULL DEFAULT false,
  requires_human_approval boolean NOT NULL DEFAULT false,
  success_metric text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_steps TO authenticated;
GRANT ALL ON public.story_steps TO service_role;
ALTER TABLE public.story_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_steps_all" ON public.story_steps;
CREATE POLICY "story_steps_all" ON public.story_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS story_steps_updated ON public.story_steps;
CREATE TRIGGER story_steps_updated BEFORE UPDATE ON public.story_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- story_funnel_memberships ----------
CREATE TABLE IF NOT EXISTS public.story_funnel_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  story_funnel_id uuid REFERENCES public.story_funnels(id) ON DELETE CASCADE,
  current_story_step_id uuid REFERENCES public.story_steps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  entered_at timestamptz NOT NULL DEFAULT now(),
  last_step_sent_at timestamptz,
  completed_at timestamptz,
  exited_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_funnel_memberships TO authenticated;
GRANT ALL ON public.story_funnel_memberships TO service_role;
ALTER TABLE public.story_funnel_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_funnel_memberships_all" ON public.story_funnel_memberships;
CREATE POLICY "story_funnel_memberships_all" ON public.story_funnel_memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- story_funnel_metrics ----------
CREATE TABLE IF NOT EXISTS public.story_funnel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  story_funnel_id uuid REFERENCES public.story_funnels(id) ON DELETE CASCADE,
  leads_entered integer NOT NULL DEFAULT 0,
  leads_replied integer NOT NULL DEFAULT 0,
  reached_offer integer NOT NULL DEFAULT 0,
  checkout_generated integer NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  best_step_id uuid,
  worst_step_id uuid,
  main_objection text,
  ai_suggestion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_funnel_metrics TO authenticated;
GRANT ALL ON public.story_funnel_metrics TO service_role;
ALTER TABLE public.story_funnel_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_funnel_metrics_all" ON public.story_funnel_metrics;
CREATE POLICY "story_funnel_metrics_all" ON public.story_funnel_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- commercial_profiles ----------
CREATE TABLE IF NOT EXISTS public.commercial_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  primary_persona text,
  secondary_persona text,
  buying_motivation text,
  buying_stage text,
  recurring_objections jsonb,
  products_of_interest jsonb,
  preferred_offer_type text,
  preferred_price_range text,
  urgency_level integer NOT NULL DEFAULT 0,
  discount_sensitivity integer NOT NULL DEFAULT 0,
  trust_barrier_level integer NOT NULL DEFAULT 0,
  upsell_potential_score integer NOT NULL DEFAULT 0,
  best_conversion_angle text,
  last_commercial_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_profiles TO authenticated;
GRANT ALL ON public.commercial_profiles TO service_role;
ALTER TABLE public.commercial_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commercial_profiles_all" ON public.commercial_profiles;
CREATE POLICY "commercial_profiles_all" ON public.commercial_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS commercial_profiles_updated ON public.commercial_profiles;
CREATE TRIGGER commercial_profiles_updated BEFORE UPDATE ON public.commercial_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- commercial_events ----------
CREATE TABLE IF NOT EXISTS public.commercial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_label text,
  signal_strength integer NOT NULL DEFAULT 0,
  extracted_text text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_events TO authenticated;
GRANT ALL ON public.commercial_events TO service_role;
ALTER TABLE public.commercial_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commercial_events_all" ON public.commercial_events;
CREATE POLICY "commercial_events_all" ON public.commercial_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- emotional_profiles ----------
CREATE TABLE IF NOT EXISTS public.emotional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  emotional_tone text,
  preferred_empathy_style text,
  relationship_stage text NOT NULL DEFAULT 'new',
  personal_context_summary text,
  important_people jsonb,
  important_events jsonb,
  sensitive_topics jsonb,
  positive_topics jsonb,
  communication_preferences jsonb,
  last_emotional_summary text,
  last_care_opportunity text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotional_profiles TO authenticated;
GRANT ALL ON public.emotional_profiles TO service_role;
ALTER TABLE public.emotional_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emotional_profiles_all" ON public.emotional_profiles;
CREATE POLICY "emotional_profiles_all" ON public.emotional_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS emotional_profiles_updated ON public.emotional_profiles;
CREATE TRIGGER emotional_profiles_updated BEFORE UPDATE ON public.emotional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- emotional_memories ----------
CREATE TABLE IF NOT EXISTS public.emotional_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  memory_type text NOT NULL,
  title text,
  content text NOT NULL,
  person_name text,
  relationship_to_lead text,
  sentiment text,
  importance integer NOT NULL DEFAULT 1,
  should_follow_up boolean NOT NULL DEFAULT false,
  follow_up_after timestamptz,
  last_used_at timestamptz,
  is_sensitive boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotional_memories TO authenticated;
GRANT ALL ON public.emotional_memories TO service_role;
ALTER TABLE public.emotional_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emotional_memories_all" ON public.emotional_memories;
CREATE POLICY "emotional_memories_all" ON public.emotional_memories FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS emotional_memories_updated ON public.emotional_memories;
CREATE TRIGGER emotional_memories_updated BEFORE UPDATE ON public.emotional_memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- lead_memories (memórias manuais simples) ----------
CREATE TABLE IF NOT EXISTS public.lead_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  memory_type text NOT NULL DEFAULT 'manual',
  importance integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_memories TO authenticated;
GRANT ALL ON public.lead_memories TO service_role;
ALTER TABLE public.lead_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_memories_all" ON public.lead_memories;
CREATE POLICY "lead_memories_all" ON public.lead_memories FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS lead_memories_updated ON public.lead_memories;
CREATE TRIGGER lead_memories_updated BEFORE UPDATE ON public.lead_memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- objection_types ----------
CREATE TABLE IF NOT EXISTS public.objection_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  default_strategy text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objection_types TO authenticated;
GRANT ALL ON public.objection_types TO service_role;
ALTER TABLE public.objection_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "objection_types_all" ON public.objection_types;
CREATE POLICY "objection_types_all" ON public.objection_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS objection_types_updated ON public.objection_types;
CREATE TRIGGER objection_types_updated BEFORE UPDATE ON public.objection_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- objection_detections ----------
CREATE TABLE IF NOT EXISTS public.objection_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  objection_type_id uuid REFERENCES public.objection_types(id) ON DELETE SET NULL,
  confidence numeric,
  detected_text text,
  recommended_action text,
  suggested_response text,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objection_detections TO authenticated;
GRANT ALL ON public.objection_detections TO service_role;
ALTER TABLE public.objection_detections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "objection_detections_all" ON public.objection_detections;
CREATE POLICY "objection_detections_all" ON public.objection_detections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- response_performance ----------
CREATE TABLE IF NOT EXISTS public.response_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  response_text text,
  response_type text,
  related_funnel_id uuid,
  related_story_funnel_id uuid,
  related_objection_id uuid,
  generated_checkout boolean NOT NULL DEFAULT false,
  led_to_purchase boolean NOT NULL DEFAULT false,
  led_to_reply boolean NOT NULL DEFAULT false,
  revenue_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.response_performance TO authenticated;
GRANT ALL ON public.response_performance TO service_role;
ALTER TABLE public.response_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "response_performance_all" ON public.response_performance;
CREATE POLICY "response_performance_all" ON public.response_performance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- cakto_webhook_events ----------
CREATE TABLE IF NOT EXISTS public.cakto_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  event_id text,
  event_type text,
  provider_order_id text,
  provider_payment_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cakto_webhook_events TO authenticated;
GRANT ALL ON public.cakto_webhook_events TO service_role;
ALTER TABLE public.cakto_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cakto_webhook_events_all" ON public.cakto_webhook_events;
CREATE POLICY "cakto_webhook_events_all" ON public.cakto_webhook_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- voice_settings ----------
CREATE TABLE IF NOT EXISTS public.voice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'elevenlabs',
  enabled boolean NOT NULL DEFAULT false,
  voice_id text,
  model text,
  send_audio_mode text NOT NULL DEFAULT 'disabled',
  send_text_with_audio boolean NOT NULL DEFAULT true,
  max_audio_messages_per_user_per_day integer NOT NULL DEFAULT 5,
  max_audio_characters integer NOT NULL DEFAULT 600,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_settings TO authenticated;
GRANT ALL ON public.voice_settings TO service_role;
ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voice_settings_all" ON public.voice_settings;
CREATE POLICY "voice_settings_all" ON public.voice_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS voice_settings_updated ON public.voice_settings;
CREATE TRIGGER voice_settings_updated BEFORE UPDATE ON public.voice_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- colunas extras em tabelas existentes ----------
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approved_at_legacy timestamptz;
ALTER TABLE public.access_grants ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.access_grants ADD COLUMN IF NOT EXISTS delivery_payload text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider text DEFAULT 'cakto';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_order_id text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS grok_enabled boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.quick_replies ADD COLUMN IF NOT EXISTS reply_type text DEFAULT 'text';
ALTER TABLE public.quick_replies ADD COLUMN IF NOT EXISTS conversion_count integer DEFAULT 0;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS trigger_event text;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS condition_json jsonb;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS delay_minutes integer DEFAULT 0;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS action_type text;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS grok_mode text DEFAULT 'manual';
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS require_approval_for_offers boolean DEFAULT true;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS require_approval_for_funnel_changes boolean DEFAULT true;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS enable_auto_reply boolean DEFAULT false;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS learning_type text;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS confidence numeric;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS suggested_action text;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS approved_by_admin boolean DEFAULT false;
ALTER TABLE public.ai_learnings ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- backfill seller_profile_id em novas tabelas
DO $$
DECLARE
  default_id uuid;
BEGIN
  SELECT id INTO default_id FROM public.seller_profiles ORDER BY created_at LIMIT 1;
  UPDATE public.leads SET seller_profile_id = default_id WHERE seller_profile_id IS NULL;
END $$;

-- criar 1 lead por telegram_user existente
INSERT INTO public.leads (seller_profile_id, telegram_user_id, display_name, username, total_spent_cents, last_purchase_at, tags)
SELECT tu.seller_profile_id, tu.id,
       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', tu.first_name, tu.last_name)), ''), tu.username, tu.telegram_id),
       tu.username,
       COALESCE((tu.total_spent * 100)::integer, 0),
       tu.last_purchase_at,
       to_jsonb(tu.tags)
FROM public.telegram_users tu
WHERE NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.telegram_user_id = tu.id);
