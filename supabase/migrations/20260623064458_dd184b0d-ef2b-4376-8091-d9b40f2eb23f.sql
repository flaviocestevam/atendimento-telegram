
-- 1) Backfill lead_id from telegram_user_id
UPDATE public.orders o
SET lead_id = l.id
FROM public.leads l
WHERE o.lead_id IS NULL
  AND l.telegram_user_id = o.telegram_user_id;

-- 2) For orders missing both plan_id and content_id: assign random plan or content from same seller
WITH need AS (
  SELECT id, seller_profile_id FROM public.orders
  WHERE plan_id IS NULL AND content_id IS NULL
),
picked AS (
  SELECT n.id AS order_id,
         n.seller_profile_id,
         (CASE WHEN random() < 0.6 THEN 'plan' ELSE 'content' END) AS pick
  FROM need n
),
plan_pick AS (
  SELECT p.order_id,
         (SELECT pl.id FROM public.plans pl
            WHERE pl.seller_profile_id = p.seller_profile_id AND pl.is_active
            ORDER BY random() LIMIT 1) AS plan_id
  FROM picked p WHERE p.pick = 'plan'
),
content_pick AS (
  SELECT p.order_id,
         (SELECT c.id FROM public.contents c
            WHERE c.seller_profile_id = p.seller_profile_id AND c.is_active
            ORDER BY random() LIMIT 1) AS content_id
  FROM picked p WHERE p.pick = 'content'
)
UPDATE public.orders o
SET plan_id = pp.plan_id, item_type = 'plan',
    amount_cents = COALESCE((SELECT price_cents FROM public.plans WHERE id = pp.plan_id), o.amount_cents)
FROM plan_pick pp
WHERE o.id = pp.order_id AND pp.plan_id IS NOT NULL;

UPDATE public.orders o
SET content_id = cp.content_id, item_type = 'content',
    amount_cents = COALESCE((SELECT price_cents FROM public.contents WHERE id = cp.content_id), o.amount_cents)
FROM (
  SELECT p.order_id,
         (SELECT c.id FROM public.contents c
            WHERE c.seller_profile_id = o2.seller_profile_id AND c.is_active
            ORDER BY random() LIMIT 1) AS content_id
  FROM public.orders o2
  JOIN (SELECT id AS order_id FROM public.orders WHERE plan_id IS NULL AND content_id IS NULL) p ON p.order_id = o2.id
) cp
WHERE o.id = cp.order_id AND cp.content_id IS NOT NULL;

-- 3) Fallback: any remaining orders without item linkage and seller has plans → assign a plan
UPDATE public.orders o
SET plan_id = (SELECT id FROM public.plans WHERE seller_profile_id = o.seller_profile_id ORDER BY random() LIMIT 1),
    item_type = 'plan'
WHERE plan_id IS NULL AND content_id IS NULL
  AND EXISTS (SELECT 1 FROM public.plans WHERE seller_profile_id = o.seller_profile_id);

-- 4) Ensure item_type matches the populated column
UPDATE public.orders SET item_type = 'plan' WHERE plan_id IS NOT NULL AND item_type <> 'plan';
UPDATE public.orders SET item_type = 'content' WHERE content_id IS NOT NULL AND plan_id IS NULL AND item_type <> 'content';
