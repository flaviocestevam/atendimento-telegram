UPDATE public.payments p SET seller_profile_id = o.seller_profile_id FROM public.orders o WHERE p.order_id = o.id AND p.seller_profile_id IS NULL AND o.seller_profile_id IS NOT NULL;
UPDATE public.orders o SET seller_profile_id = tu.seller_profile_id FROM public.telegram_users tu WHERE o.telegram_user_id = tu.id AND o.seller_profile_id IS NULL AND tu.seller_profile_id IS NOT NULL;
UPDATE public.access_grants g SET seller_profile_id = tu.seller_profile_id FROM public.telegram_users tu WHERE g.telegram_user_id = tu.id AND g.seller_profile_id IS NULL AND tu.seller_profile_id IS NOT NULL;
UPDATE public.orders        SET seller_profile_id = '11111111-1111-1111-1111-111111111111' WHERE seller_profile_id IS NULL;
UPDATE public.payments      SET seller_profile_id = '11111111-1111-1111-1111-111111111111' WHERE seller_profile_id IS NULL;
UPDATE public.access_grants SET seller_profile_id = '11111111-1111-1111-1111-111111111111' WHERE seller_profile_id IS NULL;
INSERT INTO public.quick_replies (seller_profile_id, title, category, body, type, active, reply_type)
SELECT sp.id, qr.title, qr.category, qr.body, qr.type, qr.active, qr.reply_type
FROM public.quick_replies qr CROSS JOIN public.seller_profiles sp
WHERE qr.seller_profile_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.quick_replies q2 WHERE q2.seller_profile_id = sp.id AND q2.title = qr.title);
DELETE FROM public.quick_replies WHERE seller_profile_id IS NULL;
INSERT INTO public.automation_rules (seller_profile_id, name, type, timing_value, timing_unit, message, is_active, trigger, actions, trigger_event, condition_json, delay_minutes, action_type)
SELECT sp.id, ar.name, ar.type, ar.timing_value, ar.timing_unit, ar.message, ar.is_active, ar.trigger, ar.actions, ar.trigger_event, ar.condition_json, ar.delay_minutes, ar.action_type
FROM public.automation_rules ar CROSS JOIN public.seller_profiles sp
WHERE ar.seller_profile_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.automation_rules a2 WHERE a2.seller_profile_id = sp.id AND a2.name = ar.name);
DELETE FROM public.automation_rules WHERE seller_profile_id IS NULL;
ALTER TABLE public.payments         ALTER COLUMN seller_profile_id SET NOT NULL;
ALTER TABLE public.orders           ALTER COLUMN seller_profile_id SET NOT NULL;
ALTER TABLE public.access_grants    ALTER COLUMN seller_profile_id SET NOT NULL;
ALTER TABLE public.quick_replies    ALTER COLUMN seller_profile_id SET NOT NULL;
ALTER TABLE public.automation_rules ALTER COLUMN seller_profile_id SET NOT NULL;