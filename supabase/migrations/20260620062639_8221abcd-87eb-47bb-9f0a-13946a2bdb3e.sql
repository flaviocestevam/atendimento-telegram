
-- Idioma preferido por lead
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS language_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS language_detection_source text,
  ADD COLUMN IF NOT EXISTS language_confidence integer;

-- Última atualização das regras pelo Grok
ALTER TABLE public.seller_profile
  ADD COLUMN IF NOT EXISTS commercial_rules_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS emotional_rules_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS commercial_rules_updated_by text,
  ADD COLUMN IF NOT EXISTS emotional_rules_updated_by text;
