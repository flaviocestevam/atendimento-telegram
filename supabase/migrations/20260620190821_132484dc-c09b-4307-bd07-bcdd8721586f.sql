DO $$
DECLARE
  p uuid;
  profiles uuid[] := ARRAY[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '8a22a15d-6501-4bc4-b14f-9f5cb00206ba'::uuid,
    'e65e235c-f584-4efd-a387-c1e0aee88ea6'::uuid
  ];
  lead_ids uuid[];
BEGIN
  FOREACH p IN ARRAY profiles LOOP
    SELECT array_agg(id) INTO lead_ids FROM (
      SELECT id FROM leads WHERE seller_profile_id = p ORDER BY random() LIMIT 8
    ) s;
    IF lead_ids IS NULL OR array_length(lead_ids,1) < 8 THEN CONTINUE; END IF;

    INSERT INTO objections (seller_profile_id, lead_id, type, status, confidence, suggested_reply, created_at) VALUES
      (p, lead_ids[1], 'preco',        'open',      0.92, 'Tenho um plano de entrada por R$ 19,90 com o melhor conteúdo da semana — quer testar?', now() - interval '2 hours'),
      (p, lead_ids[2], 'desconfianca', 'open',      0.81, 'Funciona assim: você paga pelo link seguro, e o acesso ao Telegram cai automático em segundos. Sem risco.', now() - interval '5 hours'),
      (p, lead_ids[3], 'vou_pensar',   'open',      0.74, 'Posso te mandar uma prévia gratuita agora pra você sentir o estilo antes de decidir?', now() - interval '1 day'),
      (p, lead_ids[4], 'nao_entendi',  'handled',   0.88, 'É um grupo VIP no Telegram com conteúdo novo toda semana + chamadas privadas comigo.', now() - interval '2 days'),
      (p, lead_ids[5], 'preco',        'open',      0.90, 'Hoje tem cupom de 30% off no plano trimestral, fica R$ 14/mês. Quer que eu envie o link?', now() - interval '3 hours'),
      (p, lead_ids[6], 'desconfianca', 'handled',   0.85, 'Pode ver os depoimentos fixados aqui, e o pagamento é processado pela Cakto.', now() - interval '3 days'),
      (p, lead_ids[7], 'vou_pensar',   'dismissed', 0.70, 'Sem pressão 😘 quer que eu te mande um lembrete amanhã com uma condição especial?', now() - interval '6 hours'),
      (p, lead_ids[8], 'preco',        'open',      0.95, 'Posso liberar um conteúdo avulso por R$ 9,90 só pra você sentir como é?', now() - interval '30 minutes');

    INSERT INTO ai_learnings (seller_profile_id, kind, content, learning_type, title, description, suggested_action, confidence, status, created_at) VALUES
      (p, 'response_pattern',   'Respostas com emoji 😘 convertem +32% em leads sardinha.', 'response_pattern',   'Respostas com emoji 😘 convertem +32%', 'Mensagens com emojis afetivos convertem mais em leads sardinha.', 'Adicionar emoji afetivo nas mensagens de fechamento.', 0.86, 'pending', now() - interval '1 day'),
      (p, 'objection_handling', 'Cupom de 20-30% no trimestral resolve 68% das objeções de preço.', 'objection_handling', 'Objeção de preço resolvida com cupom', 'Cupom de 20-30% no trimestral resolve 68% das objeções de preço.', 'Criar resposta automática com cupom trimestral.', 0.91, 'pending', now() - interval '2 days'),
      (p, 'timing',             'Janela de melhor resposta entre 20h e 23h.', 'timing',             'Melhor horário: 20h-23h', 'Leads respondem 2.4x mais entre 20h e 23h.', 'Priorizar disparos de funil neste intervalo.', 0.78, 'pending', now() - interval '3 days'),
      (p, 'upsell',             'Tier baleia aceita upsell de chamada privada em 41% dos casos.', 'upsell',             'Baleias aceitam chamada privada', 'Tier baleia aceita upsell de chamada privada em 41% dos casos.', 'Criar funil exclusivo de upsell para tier baleia.', 0.83, 'pending', now() - interval '4 days'),
      (p, 'churn',              'Insistir em leads frios aumenta bloqueios em 18%.', 'churn',              'Pausar após 3 mensagens sem resposta', 'Insistir em leads frios aumenta bloqueios em 18%.', 'Adicionar pausa automática no funil de aquecimento.', 0.74, 'pending', now() - interval '5 days'),
      (p, 'content',            'Prévias abaixo de 15s têm CTR 2x maior.', 'content',            'Prévias curtas (<15s) convertem mais', 'Prévias abaixo de 15s têm CTR 2x maior.', 'Padronizar prévias em até 15s no catálogo.', 0.80, 'pending', now() - interval '6 days');
  END LOOP;
END $$;