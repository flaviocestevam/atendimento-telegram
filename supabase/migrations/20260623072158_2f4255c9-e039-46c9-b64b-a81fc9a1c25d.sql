
DO $$
DECLARE
  rec RECORD;
  new_tu_id UUID;
  new_conv_id UUID;
  base_ts TIMESTAMPTZ;
BEGIN
  FOR rec IN
    SELECT id, seller_profile_id, display_name, username
    FROM public.leads
    WHERE telegram_user_id IS NULL AND seller_profile_id IS NOT NULL
  LOOP
    new_tu_id := gen_random_uuid();
    base_ts := now() - (random() * interval '14 days');

    INSERT INTO public.telegram_users (id, telegram_id, username, first_name, seller_profile_id, origin, created_at, updated_at)
    VALUES (new_tu_id, 'visit_' || replace(rec.id::text,'-',''), rec.username, COALESCE(rec.display_name,'Visitante'), rec.seller_profile_id, 'visitante', base_ts, base_ts);

    UPDATE public.leads SET telegram_user_id = new_tu_id WHERE id = rec.id;

    new_conv_id := gen_random_uuid();
    INSERT INTO public.conversations (id, telegram_user_id, lead_id, seller_profile_id, status, ai_enabled, grok_enabled, last_message_at, last_interaction_at, created_at, updated_at)
    VALUES (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'pending', true, true, base_ts + interval '30 minutes', base_ts + interval '30 minutes', base_ts, base_ts + interval '30 minutes');

    INSERT INTO public.messages (conversation_id, telegram_user_id, lead_id, seller_profile_id, direction, sender_type, sender, kind, text, created_at) VALUES
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'inbound',  'user', 'lead', 'text', (ARRAY['Oi, tudo bem?','Vi seu story, como funciona?','Quanto custa o pacote?','Me explica melhor','Você ainda atende?'])[1+floor(random()*5)::int], base_ts + interval '1 minute'),
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'outbound', 'ai',   'grok', 'text', 'Oi! Tudo ótimo por aqui 💕 Me conta o que você está procurando que te ajudo agora.', base_ts + interval '2 minutes'),
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'inbound',  'user', 'lead', 'text', (ARRAY['Tô interessada','Pode me mandar valores?','Tem desconto?','Quero saber mais'])[1+floor(random()*4)::int], base_ts + interval '10 minutes'),
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'outbound', 'ai',   'grok', 'text', 'Claro! Temos o plano mensal por R$ 29,90 e o trimestral com 20% off. Quer o link do checkout?', base_ts + interval '12 minutes'),
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'inbound',  'user', 'lead', 'text', (ARRAY['Pode mandar sim','Vou pensar','Manda o link','Hmm, depois te falo'])[1+floor(random()*4)::int], base_ts + interval '25 minutes'),
      (new_conv_id, new_tu_id, rec.id, rec.seller_profile_id, 'outbound', 'ai',   'grok', 'text', 'Perfeito! Qualquer dúvida é só me chamar 😘', base_ts + interval '30 minutes');
  END LOOP;
END $$;
