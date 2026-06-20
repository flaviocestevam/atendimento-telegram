
INSERT INTO public.ai_settings (seller_profile_id, provider, model, grok_global_mode, enable_ai, fallback_message, system_prompt, tone)
SELECT sp.id, 'xai', 'grok-2', 'off'::grok_global_mode, true,
  'Vou chamar um atendente humano em instantes.',
  'Você é uma assistente de vendas. Siga as regras obrigatórias do sistema. Nunca libere conteúdo sem pagamento confirmado.',
  'amigavel'
FROM public.seller_profiles sp
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings ai WHERE ai.seller_profile_id = sp.id);
