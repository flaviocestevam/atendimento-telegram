
-- Demo seed: paid orders + active grants for every telegram_user, per seller_profile
DO $$
DECLARE
  tu RECORD;
  plan_row RECORD;
  order_id uuid;
  paid_at_ts timestamptz;
BEGIN
  FOR tu IN SELECT * FROM public.telegram_users WHERE seller_profile_id IS NOT NULL LOOP
    -- pick a 30-day plan for this seller, fallback to any active plan
    SELECT * INTO plan_row
    FROM public.plans
    WHERE seller_profile_id = tu.seller_profile_id AND is_active = true
    ORDER BY (duration_days = 30) DESC, price_cents ASC
    LIMIT 1;

    IF plan_row.id IS NULL THEN CONTINUE; END IF;

    paid_at_ts := now() - ((random() * 20 + 1) || ' days')::interval;

    -- skip if user already has an active grant
    IF EXISTS (SELECT 1 FROM public.access_grants WHERE telegram_user_id = tu.id AND status = 'active') THEN
      CONTINUE;
    END IF;

    INSERT INTO public.orders (telegram_user_id, item_type, plan_id, amount_cents, status, paid_at, seller_profile_id, provider)
    VALUES (tu.id, 'plan', plan_row.id, plan_row.price_cents, 'paid', paid_at_ts, tu.seller_profile_id, 'cakto')
    RETURNING id INTO order_id;

    INSERT INTO public.access_grants (telegram_user_id, order_id, plan_id, access_type, status, starts_at, expires_at, seller_profile_id)
    VALUES (tu.id, order_id, plan_row.id, 'group', 'active', paid_at_ts, paid_at_ts + (plan_row.duration_days || ' days')::interval, tu.seller_profile_id);

    UPDATE public.telegram_users
    SET total_spent = COALESCE(total_spent,0) + (plan_row.price_cents::numeric / 100),
        last_purchase_at = paid_at_ts
    WHERE id = tu.id;
  END LOOP;
END $$;
