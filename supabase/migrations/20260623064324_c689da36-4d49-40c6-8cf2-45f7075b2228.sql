
-- Seed lead_memories: 2-4 per lead that has a seller_profile_id (via telegram_users join)
INSERT INTO public.lead_memories (seller_profile_id, lead_id, title, content, memory_type, importance)
SELECT
  tu.seller_profile_id,
  l.id,
  m.title,
  m.content,
  m.memory_type,
  m.importance
FROM public.leads l
JOIN public.telegram_users tu ON tu.id = l.telegram_user_id
CROSS JOIN LATERAL (
  VALUES
    ('Preferência de conteúdo', 'Demonstrou interesse em conteúdos premium e pacotes mensais.', 'preference', 3),
    ('Horário ativo', 'Costuma responder entre 20h e 23h.', 'behavior', 2),
    ('Objeção recorrente', 'Já mencionou preocupação com preço; respondeu bem a desconto.', 'objection', 3),
    ('Histórico', 'Cliente recorrente — segunda compra no mês.', 'note', 2)
) AS m(title, content, memory_type, importance)
WHERE tu.seller_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.lead_memories lm WHERE lm.lead_id = l.id)
LIMIT 2000;

-- Seed story_leads: assign 2-3 stories per telegram_user (story_leads.lead_id = telegram_users.id)
INSERT INTO public.story_leads (story_id, lead_id, current_step, status, last_step_at)
SELECT s.id, tu.id,
       floor(random()*4)::int,
       (ARRAY['active','completed','active'])[floor(random()*3+1)],
       now() - (random()*interval '10 days')
FROM public.telegram_users tu
JOIN LATERAL (
  SELECT id FROM public.stories
  WHERE seller_profile_id = tu.seller_profile_id OR seller_profile_id IS NULL
  ORDER BY random() LIMIT 3
) s ON true
WHERE tu.seller_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.story_leads sl WHERE sl.lead_id = tu.id AND sl.story_id = s.id);
