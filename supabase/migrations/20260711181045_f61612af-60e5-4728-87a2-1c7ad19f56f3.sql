CREATE OR REPLACE VIEW public.lead_conversation_summary
WITH (security_invoker = true) AS
SELECT 
  tu.id,
  tu.telegram_id,
  tu.first_name,
  tu.parasocial_strength,
  CASE 
    WHEN tu.parasocial_strength >= 70 THEN '🔥 Alta Conexão'
    WHEN tu.parasocial_strength >= 40 THEN '❤️ Conectado'
    ELSE '👀 Iniciando'
  END as connection_badge
FROM public.telegram_users tu;

GRANT SELECT ON public.lead_conversation_summary TO authenticated;