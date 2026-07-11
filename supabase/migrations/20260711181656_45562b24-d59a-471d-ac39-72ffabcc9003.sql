-- 1. Sugestões automáticas
CREATE TABLE IF NOT EXISTS public.parasocial_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  suggested_message TEXT NOT NULL,
  confidence INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parasocial_suggestions TO authenticated;
GRANT ALL ON public.parasocial_suggestions TO service_role;
ALTER TABLE public.parasocial_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage parasocial_suggestions"
  ON public.parasocial_suggestions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. Momentos emocionais
CREATE TABLE IF NOT EXISTS public.emotional_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  moment_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotional_moments TO authenticated;
GRANT ALL ON public.emotional_moments TO service_role;
ALTER TABLE public.emotional_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage emotional_moments"
  ON public.emotional_moments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 3. Trigger: cada momento emocional aumenta a força parassocial
CREATE OR REPLACE FUNCTION public.bump_parasocial_strength()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.telegram_users
     SET parasocial_strength = LEAST(100, COALESCE(parasocial_strength,0) + 15)
   WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emotional_moment_bump ON public.emotional_moments;
CREATE TRIGGER trg_emotional_moment_bump
AFTER INSERT ON public.emotional_moments
FOR EACH ROW EXECUTE FUNCTION public.bump_parasocial_strength();

-- 4. View de visão geral
CREATE OR REPLACE VIEW public.parasocial_overview
WITH (security_invoker=on) AS
SELECT
  tu.id,
  tu.parasocial_strength,
  COUNT(DISTINCT em.id) AS emotional_moments_count,
  COUNT(DISTINCT ps.id) FILTER (WHERE ps.used) AS suggestions_used
FROM public.telegram_users tu
LEFT JOIN public.emotional_moments em ON em.lead_id = tu.id
LEFT JOIN public.parasocial_suggestions ps ON ps.lead_id = tu.id
GROUP BY tu.id, tu.parasocial_strength;

GRANT SELECT ON public.parasocial_overview TO authenticated;