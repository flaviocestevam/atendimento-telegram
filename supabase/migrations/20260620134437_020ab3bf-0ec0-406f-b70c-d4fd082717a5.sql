
INSERT INTO public.knowledge_base (seller_profile_id, title, content, is_active)
SELECT sp.id, kb.title, kb.content, true
FROM public.seller_profiles sp
CROSS JOIN (VALUES
  ('Tom de voz', 'Sempre responder em primeira pessoa, com emoji ocasional. Carinhosa, segura, nunca agressiva. Tratar o lead pelo primeiro nome quando souber.'),
  ('Política de reembolso', 'Reembolso garantido em até 7 dias após a compra, sem perguntas. Basta o lead pedir no chat e processamos pelo Cakto.'),
  ('Formas de pagamento', 'Aceitamos Pix (instantâneo) e cartão de crédito em até 12x via Cakto. Boleto não está disponível.'),
  ('FAQ — Acesso', 'Após o pagamento confirmado, o bot envia o link/convite do grupo VIP automaticamente em até 1 minuto. Se não chegar, peça para o lead digitar /meuacesso.'),
  ('Gatilhos de upsell', 'Após 7 dias de assinatura ativa, oferecer pacote premium com 30% de desconto. Após 30 dias, oferecer plano anual com 2 meses grátis.')
) AS kb(title, content);

INSERT INTO public.story_steps (story_funnel_id, step_order, step_name, step_purpose, message_template, expected_lead_reaction, delay_minutes, requires_response, is_active)
SELECT sf.id, s.step_order, s.step_name, s.step_purpose, s.message_template, s.expected_lead_reaction, s.delay_minutes, s.requires_response, true
FROM public.story_funnels sf
CROSS JOIN (VALUES
  (1, 'Abertura', 'Capturar atenção com gancho narrativo', 'Oi {nome}, deixa eu te contar uma coisa que aconteceu comigo esses dias…', 'curiosidade', 0, false),
  (2, 'Desenvolvimento', 'Aprofundar a história criando identificação', 'E o que me marcou foi perceber que muita gente passa por isso e nem sabe…', 'engajamento', 30, false),
  (3, 'Virada', 'Conectar a história com a transformação/oferta', 'Foi aí que descobri uma forma de mudar isso. Quer que eu te conte como?', 'sim/curiosidade', 60, true),
  (4, 'Convite', 'Convidar para o próximo passo (oferta ou conversa)', 'Tenho um espaço onde compartilho tudo isso. Quer dar uma olhada?', 'aceite/recusa', 120, true)
) AS s(step_order, step_name, step_purpose, message_template, expected_lead_reaction, delay_minutes, requires_response);

WITH ranked AS (
  SELECT f.id AS funnel_id, f.seller_profile_id, l.id AS lead_id,
         ROW_NUMBER() OVER (PARTITION BY f.id ORDER BY random()) AS rn,
         (SELECT id FROM public.funnel_steps fs WHERE fs.funnel_id = f.id ORDER BY fs.step_order LIMIT 1) AS first_step
  FROM public.funnels f
  JOIN public.leads l ON l.seller_profile_id = f.seller_profile_id
)
INSERT INTO public.funnel_memberships (seller_profile_id, lead_id, funnel_id, current_step_id, status, entered_at, last_step_sent_at)
SELECT seller_profile_id, lead_id, funnel_id, first_step, 'active', now() - (random()*interval '10 days'), now() - (random()*interval '2 days')
FROM ranked WHERE rn <= 20;

WITH ranked AS (
  SELECT f.id AS funnel_id, tu.id AS tu_id,
         ROW_NUMBER() OVER (PARTITION BY f.id ORDER BY random()) AS rn
  FROM public.funnels f
  JOIN public.telegram_users tu ON tu.seller_profile_id = f.seller_profile_id
)
INSERT INTO public.funnel_leads (funnel_id, lead_id, current_step, status, last_step_at)
SELECT funnel_id, tu_id, (floor(random()*4))::int, 'active', now() - (random()*interval '3 days')
FROM ranked WHERE rn <= 10;

WITH base AS (
  SELECT sf.id AS sf_id, l.id AS lead_id, l.seller_profile_id,
         ROW_NUMBER() OVER (PARTITION BY sf.id ORDER BY random()) AS rn,
         (SELECT id FROM public.story_steps ss WHERE ss.story_funnel_id = sf.id ORDER BY ss.step_order LIMIT 1) AS first_step
  FROM public.story_funnels sf
  CROSS JOIN public.leads l
)
INSERT INTO public.story_funnel_memberships (seller_profile_id, lead_id, story_funnel_id, current_story_step_id, status, entered_at, last_step_sent_at)
SELECT seller_profile_id, lead_id, sf_id, first_step, 'active', now() - (random()*interval '10 days'), now() - (random()*interval '2 days')
FROM base WHERE rn <= 15;

WITH ranked AS (
  SELECT s.id AS story_id, tu.id AS tu_id,
         ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY random()) AS rn
  FROM public.stories s
  JOIN public.telegram_users tu ON tu.seller_profile_id = s.seller_profile_id
)
INSERT INTO public.story_leads (story_id, lead_id, current_step, status, last_step_at)
SELECT story_id, tu_id, (floor(random()*4))::int, 'active', now() - (random()*interval '3 days')
FROM ranked WHERE rn <= 10;
