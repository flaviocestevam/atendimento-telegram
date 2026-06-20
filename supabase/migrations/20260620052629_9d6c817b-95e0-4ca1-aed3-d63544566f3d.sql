
-- 1) Extend seller_profiles
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

CREATE INDEX IF NOT EXISTS seller_profiles_owner_user_id_idx ON public.seller_profiles(owner_user_id);

-- Helper: updated_at trigger reuse public.set_updated_at()

-- 2) seller_bots
CREATE TABLE IF NOT EXISTS public.seller_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  bot_name text,
  bot_username text,
  telegram_bot_id text,
  telegram_bot_token text,
  webhook_secret text,
  webhook_url text,
  status text NOT NULL DEFAULT 'inactive',
  last_webhook_update_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_bots_seller_idx ON public.seller_bots(seller_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS seller_bots_username_unique ON public.seller_bots(lower(bot_username)) WHERE bot_username IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_bots TO authenticated;
GRANT ALL ON public.seller_bots TO service_role;
ALTER TABLE public.seller_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_seller_bots ON public.seller_bots
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS trg_seller_bots_updated ON public.seller_bots;
CREATE TRIGGER trg_seller_bots_updated BEFORE UPDATE ON public.seller_bots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) seller_cakto_settings
CREATE TABLE IF NOT EXISTS public.seller_cakto_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE UNIQUE,
  cakto_api_key text,
  cakto_client_id text,
  cakto_client_secret text,
  cakto_webhook_secret text,
  cakto_webhook_url text,
  status text NOT NULL DEFAULT 'inactive',
  last_webhook_received_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_cakto_settings TO authenticated;
GRANT ALL ON public.seller_cakto_settings TO service_role;
ALTER TABLE public.seller_cakto_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_seller_cakto ON public.seller_cakto_settings
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS trg_seller_cakto_updated ON public.seller_cakto_settings;
CREATE TRIGGER trg_seller_cakto_updated BEFORE UPDATE ON public.seller_cakto_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) seller_grok_settings
CREATE TABLE IF NOT EXISTS public.seller_grok_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE UNIQUE,
  provider text NOT NULL DEFAULT 'xai',
  xai_api_key text,
  model text NOT NULL DEFAULT 'grok-4-latest',
  global_mode text NOT NULL DEFAULT 'off',
  enable_ai boolean NOT NULL DEFAULT false,
  enable_auto_reply boolean NOT NULL DEFAULT false,
  max_messages_per_user_per_day integer NOT NULL DEFAULT 50,
  require_approval_for_offers boolean NOT NULL DEFAULT true,
  require_approval_for_funnel_changes boolean NOT NULL DEFAULT true,
  system_prompt text,
  fallback_message text,
  status text NOT NULL DEFAULT 'inactive',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_grok_settings TO authenticated;
GRANT ALL ON public.seller_grok_settings TO service_role;
ALTER TABLE public.seller_grok_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_seller_grok ON public.seller_grok_settings
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS trg_seller_grok_updated ON public.seller_grok_settings;
CREATE TRIGGER trg_seller_grok_updated BEFORE UPDATE ON public.seller_grok_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) seller_voice_settings
CREATE TABLE IF NOT EXISTS public.seller_voice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE UNIQUE,
  provider text NOT NULL DEFAULT 'elevenlabs',
  elevenlabs_api_key text,
  voice_id text,
  model text,
  enabled boolean NOT NULL DEFAULT false,
  send_audio_mode text NOT NULL DEFAULT 'disabled',
  send_text_with_audio boolean NOT NULL DEFAULT true,
  max_audio_messages_per_user_per_day integer NOT NULL DEFAULT 5,
  max_audio_characters integer NOT NULL DEFAULT 600,
  status text NOT NULL DEFAULT 'inactive',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_voice_settings TO authenticated;
GRANT ALL ON public.seller_voice_settings TO service_role;
ALTER TABLE public.seller_voice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_seller_voice ON public.seller_voice_settings
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS trg_seller_voice_updated ON public.seller_voice_settings;
CREATE TRIGGER trg_seller_voice_updated BEFORE UPDATE ON public.seller_voice_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) seller_platform_settings
CREATE TABLE IF NOT EXISTS public.seller_platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE UNIQUE,
  login_enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_language text NOT NULL DEFAULT 'pt-BR',
  currency text NOT NULL DEFAULT 'BRL',
  development_mode boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_platform_settings TO authenticated;
GRANT ALL ON public.seller_platform_settings TO service_role;
ALTER TABLE public.seller_platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_seller_platform ON public.seller_platform_settings
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS trg_seller_platform_updated ON public.seller_platform_settings;
CREATE TRIGGER trg_seller_platform_updated BEFORE UPDATE ON public.seller_platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Seed config vazia para os 3 perfis demo existentes
INSERT INTO public.seller_platform_settings (seller_profile_id)
SELECT id FROM public.seller_profiles
ON CONFLICT (seller_profile_id) DO NOTHING;

INSERT INTO public.seller_cakto_settings (seller_profile_id)
SELECT id FROM public.seller_profiles
ON CONFLICT (seller_profile_id) DO NOTHING;

INSERT INTO public.seller_grok_settings (seller_profile_id)
SELECT id FROM public.seller_profiles
ON CONFLICT (seller_profile_id) DO NOTHING;

INSERT INTO public.seller_voice_settings (seller_profile_id)
SELECT id FROM public.seller_profiles
ON CONFLICT (seller_profile_id) DO NOTHING;

-- Bots demo (um por perfil) — sem token, status inactive
INSERT INTO public.seller_bots (seller_profile_id, bot_name, bot_username, status)
SELECT sp.id,
       sp.display_name || ' Bot',
       CASE
         WHEN sp.display_name ILIKE 'Lara%' THEN 'laravipbot'
         WHEN sp.display_name ILIKE 'Nina%' THEN 'ninaclubbot'
         WHEN sp.display_name ILIKE 'Maya%' THEN 'mayavipbot'
         ELSE lower(regexp_replace(sp.display_name, '[^a-zA-Z0-9]+', '', 'g')) || 'bot'
       END,
       'inactive'
FROM public.seller_profiles sp
WHERE NOT EXISTS (SELECT 1 FROM public.seller_bots b WHERE b.seller_profile_id = sp.id);
