
-- =========================================================
-- Plataforma Telegram CRM/Atendimento — v2 schema upgrade
-- =========================================================

-- Helper trigger function already exists: public.set_updated_at()

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.grok_global_mode AS ENUM ('off','suggest','auto_per_funnel','auto_all');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.grok_conv_mode AS ENUM ('inherit','off','suggest','auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ia_mode AS ENUM ('off','suggest','auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM (
    'new','in_conversation','awaiting_reply','checkout_sent','pix_pending',
    'buyer','subscriber_active','subscription_expired','in_funnel','in_story',
    'ready_upsell','inactive','blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_temperature AS ENUM ('cold','warm','hot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending','checkout_sent','approved','cancelled','expired','failed','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.message_sender AS ENUM ('lead','admin','bot','automation','grok');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.message_kind AS ENUM ('text','audio','file','image','video','link','checkout','offer','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_delivery AS ENUM ('text','link','file','image','video','audio','private_area');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.story_category AS ENUM (
    'curiosidade','proximidade','bastidores','transformacao','confianca',
    'urgencia_natural','reativacao','upsell','educacao','relacionamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.quick_reply_category AS ENUM (
    'boas_vindas','como_funciona','preco','pagamento','checkout_cakto',
    'acesso_grupo','entrega_conteudo','suporte','pix_pendente',
    'pos_compra','renovacao','upsell','objecao','outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.memory_kind AS ENUM ('commercial','emotional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.objection_type AS ENUM (
    'preco','desconfianca','vou_pensar','nao_entendi','sem_pix_agora',
    'pedido_desconto','nao_sei_se_e_pra_mim','comparando','problema_pagamento',
    'quer_humano','garantia','momento_ruim','medo_nao_receber','outra'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.objection_status AS ENUM ('open','handled','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cakto_event_action AS ENUM ('pending','linked','reprocessed','ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.learning_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.automation_trigger AS ENUM (
    'new_lead','start_command','checkout_sent','checkout_pending_10m','checkout_pending_1h',
    'payment_approved','content_delivered','access_granted','subscription_expiring',
    'subscription_expired','lead_no_reply','lead_moved_funnel','lead_moved_story',
    'grok_paused','grok_activated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- ALTER EXISTING TABLES ----------
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS cakto_offer_id TEXT,
  ADD COLUMN IF NOT EXISTS cakto_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS post_purchase_message TEXT,
  ADD COLUMN IF NOT EXISTS renewal_message TEXT,
  ADD COLUMN IF NOT EXISTS grok_can_offer BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS delivery_type public.content_delivery NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS delivery_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cakto_offer_id TEXT,
  ADD COLUMN IF NOT EXISTS cakto_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS upsell_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grok_can_offer BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS post_purchase_message TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cakto_order_id TEXT,
  ADD COLUMN IF NOT EXISTS cakto_payment_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS event_payload JSONB,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- normalize payments.status as text (keep flexible) — add CHECK via enum cast helper
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS cakto_order_id TEXT;

ALTER TABLE public.access_grants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS grok_mode public.grok_conv_mode NOT NULL DEFAULT 'inherit',
  ADD COLUMN IF NOT EXISTS needs_human BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_funnel_id UUID,
  ADD COLUMN IF NOT EXISTS current_story_id UUID,
  ADD COLUMN IF NOT EXISTS current_step INTEGER,
  ADD COLUMN IF NOT EXISTS temperature public.lead_temperature NOT NULL DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS score_buy INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_relationship INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender public.message_sender NOT NULL DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS kind public.message_kind NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.telegram_users
  ADD COLUMN IF NOT EXISTS score_buy INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_relationship INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS temperature public.lead_temperature NOT NULL DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS status public.lead_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origin TEXT;

ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS trigger public.automation_trigger,
  ADD COLUMN IF NOT EXISTS actions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS grok_global_mode public.grok_global_mode NOT NULL DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS xai_api_key_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seller_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS messages_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_estimate_cents INTEGER NOT NULL DEFAULT 0;

-- ---------- NEW TABLES ----------

-- Seller profile (singleton row)
CREATE TABLE IF NOT EXISTS public.seller_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Vendedor',
  avatar_url TEXT,
  bio TEXT,
  public_description TEXT,
  voice_tone TEXT DEFAULT 'natural',
  informality INTEGER NOT NULL DEFAULT 5,
  use_slang BOOLEAN NOT NULL DEFAULT FALSE,
  short_messages BOOLEAN NOT NULL DEFAULT TRUE,
  split_messages BOOLEAN NOT NULL DEFAULT TRUE,
  use_pauses BOOLEAN NOT NULL DEFAULT TRUE,
  allow_typos BOOLEAN NOT NULL DEFAULT FALSE,
  typo_rate INTEGER NOT NULL DEFAULT 0,
  hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  away_message TEXT,
  return_message TEXT,
  commercial_rules TEXT,
  emotional_rules TEXT,
  forbidden_promises TEXT[] NOT NULL DEFAULT '{}',
  priority_products UUID[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_profile TO authenticated;
GRANT ALL ON public.seller_profile TO service_role;
ALTER TABLE public.seller_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_seller_profile" ON public.seller_profile FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_seller_profile_updated BEFORE UPDATE ON public.seller_profile FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Funnels
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  ia_mode public.ia_mode NOT NULL DEFAULT 'off',
  ia_requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  ia_can_create_checkout BOOLEAN NOT NULL DEFAULT FALSE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnels TO authenticated;
GRANT ALL ON public.funnels TO service_role;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_funnels" ON public.funnels FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_funnels_updated BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(funnel_id, lead_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_leads TO authenticated;
GRANT ALL ON public.funnel_leads TO service_role;
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_funnel_leads" ON public.funnel_leads FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_funnel_leads_updated BEFORE UPDATE ON public.funnel_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stories (narrative funnels)
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category public.story_category NOT NULL DEFAULT 'curiosidade',
  main_angle TEXT,
  emotional_angle TEXT,
  commercial_goal TEXT,
  main_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  main_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  upsell_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  ia_mode public.ia_mode NOT NULL DEFAULT 'off',
  status TEXT NOT NULL DEFAULT 'active',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_stories_updated BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.story_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, lead_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_leads TO authenticated;
GRANT ALL ON public.story_leads TO service_role;
ALTER TABLE public.story_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_story_leads" ON public.story_leads FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_story_leads_updated BEFORE UPDATE ON public.story_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Quick replies
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.quick_reply_category NOT NULL DEFAULT 'outro',
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_replies TO authenticated;
GRANT ALL ON public.quick_replies TO service_role;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_quick_replies" ON public.quick_replies FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_quick_replies_updated BEFORE UPDATE ON public.quick_replies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Memories
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  kind public.memory_kind NOT NULL DEFAULT 'commercial',
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_memories" ON public.memories FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_memories_updated BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_memories_lead ON public.memories(lead_id);

-- Objections
CREATE TABLE IF NOT EXISTS public.objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  type public.objection_type NOT NULL DEFAULT 'outra',
  status public.objection_status NOT NULL DEFAULT 'open',
  confidence INTEGER NOT NULL DEFAULT 50,
  suggested_reply TEXT,
  converted_after BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objections TO authenticated;
GRANT ALL ON public.objections TO service_role;
ALTER TABLE public.objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_objections" ON public.objections FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_objections_updated BEFORE UPDATE ON public.objections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Cakto events
CREATE TABLE IF NOT EXISTS public.cakto_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  buyer_email TEXT,
  amount NUMERIC(12,2),
  status TEXT,
  external_reference TEXT,
  cakto_payment_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  action public.cakto_event_action NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cakto_events TO authenticated;
GRANT ALL ON public.cakto_events TO service_role;
ALTER TABLE public.cakto_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_cakto_events" ON public.cakto_events FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cakto_events_updated BEFORE UPDATE ON public.cakto_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AI learnings
CREATE TABLE IF NOT EXISTS public.ai_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  status public.learning_status NOT NULL DEFAULT 'pending',
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_learnings TO authenticated;
GRANT ALL ON public.ai_learnings TO service_role;
ALTER TABLE public.ai_learnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_all_ai_learnings" ON public.ai_learnings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_ai_learnings_updated BEFORE UPDATE ON public.ai_learnings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- SEEDS ----------
INSERT INTO public.seller_profile (display_name, bio, public_description, voice_tone)
SELECT 'Vendedor', 'Atendimento direto pelo Telegram.', 'Conteúdos, planos e suporte personalizado.', 'natural'
WHERE NOT EXISTS (SELECT 1 FROM public.seller_profile);

INSERT INTO public.ai_settings (grok_global_mode, xai_api_key_set)
SELECT 'off', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings);

-- Default quick replies
INSERT INTO public.quick_replies (title, category, body) VALUES
  ('Boas-vindas', 'boas_vindas', 'Olá! Tudo bem? Como posso te ajudar hoje?'),
  ('Como funciona', 'como_funciona', 'Funciona assim: você escolhe o plano ou conteúdo, paga pelo link e recebe acesso imediato aqui no Telegram.'),
  ('Preço', 'preco', 'Os valores estão na nossa lista de planos. Posso te enviar a oferta certa pro que você precisa?'),
  ('Pix pendente', 'pix_pendente', 'Vi que o seu pagamento ainda está pendente. Assim que cair, libero seu acesso automaticamente.'),
  ('Pós-compra', 'pos_compra', 'Pagamento confirmado! Já estou liberando seu acesso, qualquer dúvida me chama.')
ON CONFLICT DO NOTHING;
