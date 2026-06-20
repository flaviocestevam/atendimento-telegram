
UPDATE public.telegram_users SET
  score_buy = CASE status
    WHEN 'buyer' THEN 85 + (floor(random()*15))::int
    WHEN 'subscriber_active' THEN 90 + (floor(random()*10))::int
    WHEN 'ready_upsell' THEN 80 + (floor(random()*15))::int
    WHEN 'checkout_sent' THEN 65 + (floor(random()*20))::int
    WHEN 'pix_pending' THEN 70 + (floor(random()*15))::int
    WHEN 'in_conversation' THEN 40 + (floor(random()*25))::int
    WHEN 'in_funnel' THEN 50 + (floor(random()*25))::int
    WHEN 'new' THEN 10 + (floor(random()*20))::int
    WHEN 'inactive' THEN 5 + (floor(random()*15))::int
    ELSE 20 + (floor(random()*30))::int
  END + CASE temperature
    WHEN 'hot' THEN 10
    WHEN 'warm' THEN 5
    ELSE 0
  END,
  tags = (
    CASE status
      WHEN 'buyer' THEN ARRAY['comprador']
      WHEN 'subscriber_active' THEN ARRAY['assinante','recorrente']
      WHEN 'ready_upsell' THEN ARRAY['comprador','upsell']
      WHEN 'checkout_sent' THEN ARRAY['checkout']
      WHEN 'pix_pending' THEN ARRAY['pix-pendente']
      WHEN 'in_conversation' THEN ARRAY['engajado']
      WHEN 'in_funnel' THEN ARRAY['funil']
      WHEN 'new' THEN ARRAY['novo']
      WHEN 'inactive' THEN ARRAY['inativo']
      ELSE ARRAY[]::text[]
    END
    || CASE temperature
      WHEN 'hot' THEN ARRAY['quente']
      WHEN 'warm' THEN ARRAY['morno']
      WHEN 'cold' THEN ARRAY['frio']
      ELSE ARRAY[]::text[]
    END
  );
