
-- 1. plans: billing_type (assinatura recorrente vs one-shot)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'one_shot',
  ADD COLUMN IF NOT EXISTS trial_days integer;

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_billing_type_check;
ALTER TABLE public.plans
  ADD CONSTRAINT plans_billing_type_check CHECK (billing_type IN ('one_shot', 'subscription'));

-- 2. access_grants: rastrear assinatura recorrente Cakto + cancelamento pedido
ALTER TABLE public.access_grants
  ADD COLUMN IF NOT EXISTS cakto_subscription_id text,
  ADD COLUMN IF NOT EXISTS next_charge_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_access_grants_cakto_sub ON public.access_grants(cakto_subscription_id) WHERE cakto_subscription_id IS NOT NULL;

-- 3. payments: subscription id (evento de renovação chega com o mesmo subscription id)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cakto_subscription_id text,
  ADD COLUMN IF NOT EXISTS is_renewal boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_payments_cakto_sub ON public.payments(cakto_subscription_id) WHERE cakto_subscription_id IS NOT NULL;

-- 4. Tabela para logar tentativas de retenção (quando o lead pede pra cancelar)
CREATE TABLE IF NOT EXISTS public.cancellation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  access_grant_id uuid REFERENCES public.access_grants(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  telegram_user_id uuid REFERENCES public.telegram_users(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'requested',
  offer_shown text,
  outcome text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_events
  DROP CONSTRAINT IF EXISTS cancellation_events_stage_check;
ALTER TABLE public.cancellation_events
  ADD CONSTRAINT cancellation_events_stage_check
  CHECK (stage IN ('requested','offered','retained','confirmed','completed'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cancellation_events TO authenticated;
GRANT ALL ON public.cancellation_events TO service_role;

ALTER TABLE public.cancellation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage cancellation_events" ON public.cancellation_events;
CREATE POLICY "Admins manage cancellation_events" ON public.cancellation_events
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
