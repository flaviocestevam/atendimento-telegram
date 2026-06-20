
-- 1) Colunas
ALTER TABLE public.telegram_users ADD COLUMN IF NOT EXISTS buyer_tier text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS buyer_tier text;

-- 2) Função utilitária (recebe valor em REAIS)
CREATE OR REPLACE FUNCTION public.calc_buyer_tier(total_brl numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN total_brl IS NULL OR total_brl < 50 THEN 'sardinha'
    WHEN total_brl < 200 THEN 'dourado'
    WHEN total_brl < 1000 THEN 'salmao'
    ELSE 'baleia'
  END
$$;

-- 3) Triggers
CREATE OR REPLACE FUNCTION public.set_buyer_tier_tu()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.buyer_tier := public.calc_buyer_tier(COALESCE(NEW.total_spent, 0));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_buyer_tier_leads()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.buyer_tier := public.calc_buyer_tier(COALESCE(NEW.total_spent_cents, 0)::numeric / 100);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_buyer_tier_tu ON public.telegram_users;
CREATE TRIGGER trg_buyer_tier_tu
BEFORE INSERT OR UPDATE OF total_spent ON public.telegram_users
FOR EACH ROW EXECUTE FUNCTION public.set_buyer_tier_tu();

DROP TRIGGER IF EXISTS trg_buyer_tier_leads ON public.leads;
CREATE TRIGGER trg_buyer_tier_leads
BEFORE INSERT OR UPDATE OF total_spent_cents ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_buyer_tier_leads();

-- 4) Backfill
UPDATE public.telegram_users
SET buyer_tier = public.calc_buyer_tier(COALESCE(total_spent, 0));

UPDATE public.leads
SET buyer_tier = public.calc_buyer_tier(COALESCE(total_spent_cents, 0)::numeric / 100);
