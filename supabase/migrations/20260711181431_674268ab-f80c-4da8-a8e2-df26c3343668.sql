CREATE OR REPLACE VIEW public.parasocial_dashboard 
WITH (security_invoker=on) AS
SELECT 
  COUNT(*)::bigint as total_leads,
  COUNT(CASE WHEN parasocial_strength >= 70 THEN 1 END)::bigint as alta_conexao,
  COALESCE(AVG(parasocial_strength), 0)::numeric as media_conexao,
  COUNT(CASE WHEN parasocial_strength >= 70 AND total_spent > 0 THEN 1 END)::bigint as alta_conexao_com_compra
FROM public.telegram_users;

GRANT SELECT ON public.parasocial_dashboard TO authenticated;