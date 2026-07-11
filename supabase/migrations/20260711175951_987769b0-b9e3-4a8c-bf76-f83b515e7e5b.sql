ALTER TABLE public.telegram_users ADD COLUMN IF NOT EXISTS parasocial_strength INTEGER NOT NULL DEFAULT 0 CHECK (parasocial_strength BETWEEN 0 AND 100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS parasocial_strength INTEGER NOT NULL DEFAULT 0 CHECK (parasocial_strength BETWEEN 0 AND 100);
CREATE INDEX IF NOT EXISTS idx_telegram_users_parasocial ON public.telegram_users(parasocial_strength DESC);
COMMENT ON COLUMN public.telegram_users.parasocial_strength IS 'Score de força da conexão parassocial (0-100) - usado para priorização e gatilhos';
COMMENT ON COLUMN public.leads.parasocial_strength IS 'Score de força da conexão parassocial (0-100) - usado para priorização e gatilhos';